import pytest
import json
import os
import tempfile
from app import create_app
from models import db, Contact

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file for the test database
    db_fd, db_path = tempfile.mkstemp()
    
    # Configure the app for testing
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'API_KEY': 'test_api_key'
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    
    # Clean up the temporary file
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

def test_health_endpoint(client):
    """Test the health endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'ok'

def test_get_contacts_empty(client):
    """Test getting contacts when database is empty."""
    response = client.get('/api/contacts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == []

def test_create_contact_without_api_key(client):
    """Test creating a contact without API key should fail."""
    contact_data = {
        'name': 'João Silva',
        'email': 'joao@example.com',
        'phone': '11999999999',
        'notes': 'Cliente potencial'
    }
    
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_create_contact_with_valid_api_key(client):
    """Test creating a contact with valid API key."""
    contact_data = {
        'name': 'João Silva',
        'email': 'joao@example.com',
        'phone': '11999999999',
        'notes': 'Cliente potencial'
    }
    
    headers = {'X-API-KEY': 'test_api_key'}
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'João Silva'
    assert data['email'] == 'joao@example.com'
    assert data['phone'] == '11999999999'
    assert data['notes'] == 'Cliente potencial'
    assert 'id' in data
    assert 'created_at' in data

def test_create_contact_missing_required_field(client):
    """Test creating a contact with missing required field."""
    contact_data = {
        'name': 'João Silva',
        # email is missing
        'phone': '11999999999'
    }
    
    headers = {'X-API-KEY': 'test_api_key'}
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'email' in data['error']

def test_create_duplicate_email(client):
    """Test creating a contact with duplicate email."""
    contact_data = {
        'name': 'João Silva',
        'email': 'joao@example.com',
        'phone': '11999999999'
    }
    
    headers = {'X-API-KEY': 'test_api_key'}
    
    # Create first contact
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    
    # Try to create second contact with same email
    contact_data['name'] = 'Maria Silva'
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'error' in data
    assert 'already exists' in data['error']

def test_get_contacts_after_creation(client):
    """Test getting contacts after creating one."""
    contact_data = {
        'name': 'João Silva',
        'email': 'joao@example.com',
        'phone': '11999999999',
        'notes': 'Cliente potencial'
    }
    
    headers = {'X-API-KEY': 'test_api_key'}
    
    # Create contact
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    
    # Get all contacts
    response = client.get('/api/contacts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]['name'] == 'João Silva'
    assert data[0]['email'] == 'joao@example.com'

def test_get_specific_contact(client):
    """Test getting a specific contact by ID."""
    contact_data = {
        'name': 'João Silva',
        'email': 'joao@example.com',
        'phone': '11999999999',
        'notes': 'Cliente potencial'
    }
    
    headers = {'X-API-KEY': 'test_api_key'}
    
    # Create contact
    response = client.post('/api/contacts', 
                          data=json.dumps(contact_data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    created_contact = json.loads(response.data)
    contact_id = created_contact['id']
    
    # Get specific contact
    response = client.get(f'/api/contacts/{contact_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'João Silva'
    assert data['email'] == 'joao@example.com'
    assert data['id'] == contact_id

def test_get_nonexistent_contact(client):
    """Test getting a contact that doesn't exist."""
    response = client.get('/api/contacts/999')
    assert response.status_code == 404