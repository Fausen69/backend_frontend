import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function ProductsPage() {
  const { canFilterProducts, canManageProducts, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('🔍 ProductsPage mounted');
    console.log('Token:', token ? 'Есть' : 'Нет');
    console.log('canFilterProducts:', canFilterProducts);
    fetchProducts();
  }, [filters, canFilterProducts, token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo('Загрузка...');
      
      const queryParams = new URLSearchParams();
      
      if (canFilterProducts) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }

      const url = canFilterProducts
        ? `http://localhost:3000/api/products/catalog?${queryParams}`
        : 'http://localhost:3000/api/products';

      console.log('Запрос к:', url);
      setDebugInfo(`Запрос: ${url}`);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Token added to headers');
      }

      const res = await fetch(url, { headers });
      console.log('Ответ:', res.status, res.statusText);
      setDebugInfo(`Ответ сервера: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Ошибка:', errorText);
        throw new Error(`Ошибка ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Данные:', data);
      
      setProducts(data.products || data);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      setError(null);
      setDebugInfo(`Загружено товаров: ${data.products?.length || data.length || 0}`);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
      setDebugInfo(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 12
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>
            <h2>Загрузка товаров...</h2>
            {debugInfo && <p style={{ marginTop: '1rem' }}>{debugInfo}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error" style={{ 
          padding: '2rem', 
          background: '#fee', 
          border: '2px solid #c00',
          borderRadius: '8px',
          marginTop: '2rem'
        }}>
          <h3>❌ Ошибка загрузки</h3>
          <p><strong>Сообщение:</strong> {error}</p>
          <p><strong>Детали:</strong> {debugInfo}</p>
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={fetchProducts}
              style={{ marginRight: '1rem' }}
            >
              Повторить
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => window.location.reload()}
            >
              Перезагрузить страницу
            </button>
          </div>
          <details style={{ marginTop: '1rem' }}>
            <summary>Показать техническую информацию</summary>
            <pre style={{ 
              background: '#333', 
              color: '#0f0', 
              padding: '1rem', 
              borderRadius: '4px',
              overflow: 'auto',
              marginTop: '1rem'
            }}>
              {JSON.stringify({ error, debugInfo, filters, token: token ? '***' : null }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '2.5rem' }}>
        Каталог товаров
      </h1>

      {canFilterProducts && (
        <div className="filters">
          <div className="filters-content">
            <div className="filter-group">
              <label>Поиск</label>
              <input
                type="text"
                placeholder="Название или описание..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Категория</label>
              <input
                type="text"
                placeholder="Все категории"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Мин. цена</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Макс. цена</label>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Сортировка</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="createdAt">По дате</option>
                <option value="name">По названию</option>
                <option value="price">По цене</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Порядок</label>
              <select
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
              >
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </div>

            <button className="btn btn-secondary" onClick={resetFilters}>
              Сбросить
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-text">Товары не найдены</div>
            <button className="btn btn-primary" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <img
                src={product.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                alt={product.name}
                className="product-image"
              />
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-price">{product.price} ₽</div>
                <span className="product-category">{product.category || 'Без категории'}</span>
                {product.stock !== undefined && (
                  <div style={{ marginTop: '1rem', color: product.stock > 0 ? '#48bb78' : '#f56565' }}>
                    {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет в наличии'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          marginTop: '3rem' 
        }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`btn ${page === filters.page ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleFilterChange('page', page)}
              style={{ minWidth: '40px' }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}