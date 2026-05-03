import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function AdminPanel() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: '',
    stock: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `http://localhost:3000/api/products/${editingProduct.id}`
        : 'http://localhost:3000/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка');
      }

      alert(editingProduct ? 'Товар обновлён' : 'Товар создан');
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', description: '', image: '', category: '', stock: '' });
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      image: product.image || '',
      category: product.category || '',
      stock: product.stock.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот товар?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      alert('Товар удалён');
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="alert alert-error">Ошибка: {error}</div>;

  return (
    <div className="container fade-in">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem' }}>
          Админ-панель
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', description: '', image: '', category: '', stock: '' });
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Закрыть' : 'Добавить товар'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ animation: 'fadeIn 0.3s ease-out', marginBottom: '2rem' }}>
          <h2 className="card-title">
            {editingProduct ? 'Редактирование товара' : 'Новый товар'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Название *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Цена *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Категория</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Количество</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">URL изображения</label>
              <input
                type="text"
                className="form-input"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success">
                {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Управление товарами ({products.length})</h2>
        
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">Товаров пока нет</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Цена</th>
                  <th>Категория</th>
                  <th>В наличии</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                          {product.description.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td>{product.price} ₽</td>
                    <td>{product.category || '-'}</td>
                    <td>
                      <span style={{ 
                        color: product.stock > 0 ? '#48bb78' : '#f56565',
                        fontWeight: '600'
                      }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleEdit(product)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          Изменить
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleDelete(product.id)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}