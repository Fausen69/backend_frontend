import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function OrdersPage() {
  const { user, token, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOrder, setNewOrder] = useState({
    items: [{ productId: '', quantity: 1 }],
    shippingAddress: '',
    comment: ''
  });
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? 'http://localhost:3000/api/orders' 
        : 'http://localhost:3000/api/orders/my';
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Ошибка загрузки');
      
      const data = await res.json();
      setOrders(data.orders || data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const items = newOrder.items
        .filter(item => item.productId)
        .map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity)
        }));

      if (items.length === 0) {
        throw new Error('Добавьте хотя бы один товар');
      }

      const res = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items,
          shippingAddress: newOrder.shippingAddress,
          comment: newOrder.comment
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка создания заказа');
      }

      alert('Заказ успешно создан!');
      setNewOrder({ items: [{ productId: '', quantity: 1 }], shippingAddress: '', comment: '' });
      setShowOrderForm(false);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Ошибка обновления');
      alert('Статус обновлён');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge-pending',
      'PROCESSING': 'badge-processing',
      'SHIPPED': 'badge-shipped',
      'DELIVERED': 'badge-delivered',
      'CANCELLED': 'badge-cancelled'
    };
    const labels = {
      'PENDING': 'Ожидает',
      'PROCESSING': 'В обработке',
      'SHIPPED': 'Отправлен',
      'DELIVERED': 'Доставлен',
      'CANCELLED': 'Отменён'
    };
    return (
      <span className={`badge ${badges[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <div className="loading">Загрузка заказов...</div>;
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
          {isAdmin ? 'Все заказы' : 'Мои заказы'}
        </h1>
        {!isAdmin && user && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowOrderForm(!showOrderForm)}
          >
            {showOrderForm ? 'Закрыть' : 'Новый заказ'}
          </button>
        )}
      </div>

      {showOrderForm && !isAdmin && (
        <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h2 className="card-title">Оформление заказа</h2>
          <form onSubmit={handleSubmitOrder}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Товары</label>
              {newOrder.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginBottom: '1rem',
                  alignItems: 'center'
                }}>
                  <input
                    type="number"
                    placeholder="ID товара"
                    value={item.productId}
                    onChange={(e) => {
                      const items = [...newOrder.items];
                      items[index].productId = e.target.value;
                      setNewOrder({ ...newOrder, items });
                    }}
                    className="form-input"
                    style={{ flex: 1 }}
                    required={index === 0}
                  />
                  <input
                    type="number"
                    placeholder="Кол-во"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const items = [...newOrder.items];
                      items[index].quantity = e.target.value;
                      setNewOrder({ ...newOrder, items });
                    }}
                    className="form-input"
                    style={{ width: '120px' }}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        const items = newOrder.items.filter((_, i) => i !== index);
                        setNewOrder({ ...newOrder, items });
                      }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNewOrder({ 
                  ...newOrder, 
                  items: [...newOrder.items, { productId: '', quantity: 1 }] 
                })}
              >
                Добавить товар
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Адрес доставки *</label>
              <input
                type="text"
                placeholder="Город, улица, дом, квартира"
                value={newOrder.shippingAddress}
                onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Комментарий</label>
              <textarea
                placeholder="Дополнительная информация..."
                value={newOrder.comment}
                onChange={(e) => setNewOrder({ ...newOrder, comment: e.target.value })}
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              Оформить заказ
            </button>
          </form>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-text">
              {isAdmin ? 'Заказов пока нет' : 'У вас ещё нет заказов'}
            </div>
            {!isAdmin && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowOrderForm(true)}
              >
                Сделать первый заказ
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '1.2rem', color: '#2d3748' }}>
                      Заказ #{order.id}
                    </strong>
                    <span style={{ marginLeft: '1rem' }}>
                      {getStatusBadge(order.status)}
                    </span>
                  </div>

                  <div style={{ color: '#718096', marginBottom: '0.5rem' }}>
                    Сумма: <strong>{order.total?.toString()} ₽</strong>
                  </div>

                  {order.user?.email && (
                    <div style={{ color: '#718096', marginBottom: '0.5rem' }}>
                      Клиент: <strong>{order.user.email}</strong>
                    </div>
                  )}

                  <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                    {new Date(order.createdAt).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ minWidth: '200px' }}>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Изменить статус:
                    </label>
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="form-input"
                    >
                      <option value="PENDING">Ожидает</option>
                      <option value="PROCESSING">В обработке</option>
                      <option value="SHIPPED">Отправлен</option>
                      <option value="DELIVERED">Доставлен</option>
                      <option value="CANCELLED">Отменён</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}