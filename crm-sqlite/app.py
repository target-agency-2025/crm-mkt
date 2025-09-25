import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from functools import wraps
from models import db, Contact

load_dotenv()

def require_api_key(f):
    """Decorator to require API key for write operations"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-KEY')
        expected_key = os.getenv('API_KEY')
        
        if not expected_key:
            return jsonify({'error': 'API key not configured on server'}), 500
        
        if not api_key or api_key != expected_key:
            return jsonify({'error': 'Invalid or missing API key'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def create_app():
    app = Flask(__name__)
    
    # Configuration
    sqlite_path = os.getenv('SQLITE_PATH', 'data/crm.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # CORS configuration
    cors_origins = os.getenv('CORS_ORIGINS', '*')
    CORS(app, origins=cors_origins.split(',') if cors_origins != '*' else cors_origins)
    
    # Create tables
    with app.app_context():
        # Ensure data directory exists
        db_dir = os.path.dirname(sqlite_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
        
        db.create_all()
    
    # Routes
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok'})
    
    @app.route('/api/contacts', methods=['GET'])
    def get_contacts():
        try:
            contacts = Contact.query.order_by(Contact.created_at.desc()).all()
            return jsonify([contact.to_dict() for contact in contacts])
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/contacts', methods=['POST'])
    @require_api_key
    def create_contact():
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            # Validate required fields
            required_fields = ['name', 'email']
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            # Check if email already exists
            existing_contact = Contact.query.filter_by(email=data['email']).first()
            if existing_contact:
                return jsonify({'error': 'Email already exists'}), 409
            
            # Create new contact
            contact = Contact(
                name=data['name'],
                email=data['email'],
                phone=data.get('phone'),
                notes=data.get('notes')
            )
            
            db.session.add(contact)
            db.session.commit()
            
            return jsonify(contact.to_dict()), 201
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/contacts/<int:contact_id>', methods=['GET'])
    def get_contact(contact_id):
        try:
            contact = Contact.query.get_or_404(contact_id)
            return jsonify(contact.to_dict())
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return app

# For development
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)