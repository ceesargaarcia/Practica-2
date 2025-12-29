// Verificar autenticación
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/login';
}

// Mostrar información del usuario
const userInfo = document.getElementById('userInfo');
if (userInfo) {
    userInfo.textContent = `👤 ${user.username} (${user.role})`;
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '/login';
    });
}

// Variables globales
const productsGrid = document.getElementById('productsGrid');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const addProductBtn = document.getElementById('addProductBtn');
const closeModal = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const modalTitle = document.getElementById('modalTitle');

let isEditing = false;
let editingProductId = null;

// Mostrar botón de añadir solo para admins
if (user.role === 'admin' && addProductBtn) {
    addProductBtn.style.display = 'block';
}

// Event Listeners
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        openModal();
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        closeModalFunc();
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        closeModalFunc();
    });
}

if (productModal) {
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            closeModalFunc();
        }
    });
}

if (productForm) {
    productForm.addEventListener('submit', handleProductSubmit);
}

// Funciones
async function loadProducts() {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }

        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error:', error);
        productsGrid.innerHTML = '<p class="error-message">Error al cargar los productos</p>';
    }
}

function displayProducts(products) {
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="loading">No hay productos disponibles</p>';
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="product-price">${product.price.toFixed(2)} €</p>
                <p class="product-stock">Stock: ${product.stock} unidades</p>
                ${user.role === 'admin' ? `
                    <div class="product-actions">
                        <button class="btn btn-secondary" onclick="editProduct('${product._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function openModal(product = null) {
    isEditing = !!product;
    editingProductId = product?._id || null;

    modalTitle.textContent = isEditing ? 'Editar Producto' : 'Añadir Producto';

    if (product) {
        document.getElementById('productId').value = product._id;
        document.getElementById('name').value = product.name;
        document.getElementById('description').value = product.description;
        document.getElementById('price').value = product.price;
        document.getElementById('category').value = product.category;
        document.getElementById('stock').value = product.stock;
        document.getElementById('imageUrl').value = product.imageUrl;
    } else {
        productForm.reset();
        document.getElementById('productId').value = '';
    }

    productModal.classList.add('active');
}

function closeModalFunc() {
    productModal.classList.remove('active');
    productForm.reset();
    isEditing = false;
    editingProductId = null;
    clearMessages();
}

async function handleProductSubmit(e) {
    e.preventDefault();
    clearMessages();

    const productData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        price: parseFloat(document.getElementById('price').value),
        category: document.getElementById('category').value,
        stock: parseInt(document.getElementById('stock').value),
        imageUrl: document.getElementById('imageUrl').value || 'https://via.placeholder.com/300'
    };

    try {
        const url = isEditing 
            ? `/api/products/${editingProductId}` 
            : '/api/products';
        
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess(data.message);
            closeModalFunc();
            loadProducts();
        } else {
            showError(data.message || 'Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Intenta nuevamente.');
    }
}

async function editProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const product = await response.json();
            openModal(product);
        } else {
            showError('Error al cargar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess(data.message);
            loadProducts();
        } else {
            showError(data.message || 'Error al eliminar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    setTimeout(() => {
        errorMessage.textContent = '';
    }, 5000);
}

function showSuccess(message) {
    successMessage.textContent = message;
    setTimeout(() => {
        successMessage.textContent = '';
    }, 3000);
}

function clearMessages() {
    errorMessage.textContent = '';
    successMessage.textContent = '';
}

// Cargar productos al iniciar
if (productsGrid) {
    loadProducts();
}