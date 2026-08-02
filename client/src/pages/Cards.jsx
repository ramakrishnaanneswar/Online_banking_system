import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiLock, FiUnlock, FiCreditCard } from 'react-icons/fi';
import api from '../api';
import { formatINR, accountTypeLabel } from '../utils/format';
import Spinner from '../components/common/Spinner';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [formData, setFormData] = useState({
    accountId: '',
    cardType: 'debit',
    network: 'visa',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cardsRes, accRes] = await Promise.all([api.get('/cards'), api.get('/accounts')]);
      setCards(cardsRes.data.data);
      setAccounts(accRes.data.data);
    } catch (error) {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.cardType) {
      toast.error('Please select an account and card type');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/cards', formData);
      toast.success(res.data.message);
      setShowCreate(false);
      setFormData({ accountId: '', cardType: 'debit', network: 'visa' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  const handleBlock = async (cardId, status) => {
    const action = status === 'blocked' ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this card?`)) return;

    try {
      const res = await api.put(`/cards/${cardId}/${action}`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update card status');
    }
  };

  const handleShowDetails = async (cardId) => {
    try {
      const res = await api.get(`/cards/${cardId}`);
      setShowDetails(res.data.data);
    } catch (error) {
      toast.error('Failed to load card details');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading cards...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cards</h1>
          <p>Manage your debit and credit cards</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
            <FiPlus /> {showCreate ? 'Cancel' : 'Request New Card'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card mb-3">
          <h3 className="card-title mb-2">
            <FiCreditCard /> Request a New Card
          </h3>
          <form onSubmit={handleCreate} className="grid grid-3" style={{ alignItems: 'end', gap: '12px' }}>
            <div className="form-group mb-0">
              <label>Linked Account</label>
              <select
                className="form-control"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {accountTypeLabel(acc.accountType)} - {acc.accountNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label>Card Type</label>
              <select
                className="form-control"
                value={formData.cardType}
                onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
              >
                <option value="debit">Debit Card</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label>Network</label>
              <select
                className="form-control"
                value={formData.network}
                onChange={(e) => setFormData({ ...formData, network: e.target.value })}
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="rupay">RuPay</option>
              </select>
            </div>
            <div className="flex" style={{ gridColumn: 'span 3', gap: '8px' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                {creating ? 'Requesting...' : 'Request Card'} {creating && <Spinner size={14} color="#fff" />}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {cards.length > 0 ? (
        <div className="grid grid-2">
          {cards.map((card) => (
            <div key={card._id}>
              <div className={`bank-card ${card.cardType} ${card.status === 'blocked' ? 'blocked' : ''}`}>
                <div className="flex-between">
                  <div className="bank-card-chip"></div>
                  <div className="bank-card-network">
                    {card.network === 'visa' ? 'VISA' : card.network === 'mastercard' ? 'Mastercard' : 'RuPay'}
                  </div>
                </div>
                <div className="bank-card-number">{card.cardNumber}</div>
                <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                  <div className="bank-card-details">
                    <div>
                      Card Holder
                      <strong>{card.cardHolderName}</strong>
                    </div>
                    <div>
                      Expires
                      <strong>{card.expiryMonth}/{card.expiryYear}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${card.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {card.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card mt-2" style={{ padding: '16px 24px' }}>
                <div className="flex-between">
                  <div>
                    <strong style={{ fontSize: '13px', textTransform: 'capitalize' }}>{card.cardType} Card</strong>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {card.cardType === 'credit'
                        ? `Credit Limit: ${formatINR(card.creditLimit)} • Due: ${formatINR(card.outstandingBalance)}`
                        : `Daily Limit: ${formatINR(card.dailyLimit)}`}
                    </div>
                  </div>
                  <div className="flex" style={{ gap: '8px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleShowDetails(card._id)}>
                      Details
                    </button>
                    <button
                      className={`btn btn-sm ${card.status === 'blocked' ? 'btn-success' : 'btn-danger'}`}
                      onClick={() => handleBlock(card._id, card.status)}
                    >
                      {card.status === 'blocked' ? (
                        <>
                          <FiUnlock /> Unblock
                        </>
                      ) : (
                        <>
                          <FiLock /> Block
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <div className="empty-state-icon">💳</div>
          <h3>No cards yet</h3>
          <p>Request your first card to start using it.</p>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowCreate(true)}>
            <FiPlus /> Request Card
          </button>
        </div>
      )}

      {/* Card details modal */}
      {showDetails && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }} onClick={() => setShowDetails(null)}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Card Details</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowDetails(null)}>Close</button>
            </div>
            <div style={{ fontSize: '14px' }}>
              <div className="flex-between py-1">
                <span className="text-muted">Card Type</span>
                <strong style={{ textTransform: 'capitalize' }}>{showDetails.cardType} Card</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Card Number</span>
                <strong style={{ letterSpacing: '2px' }}>
                  {showDetails.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                </strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Card Holder</span>
                <strong>{showDetails.cardHolderName}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Expiry</span>
                <strong>{showDetails.expiryMonth}/{showDetails.expiryYear}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">CVV</span>
                <strong>{showDetails.cvv}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Network</span>
                <strong style={{ textTransform: 'capitalize' }}>{showDetails.network}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Status</span>
                <span className={`badge ${showDetails.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {showDetails.status}
                </span>
              </div>
              {showDetails.cardType === 'credit' && (
                <>
                  <div className="flex-between py-1">
                    <span className="text-muted">Credit Limit</span>
                    <strong>{formatINR(showDetails.creditLimit)}</strong>
                  </div>
                  <div className="flex-between py-1">
                    <span className="text-muted">Outstanding</span>
                    <strong style={{ color: 'var(--danger)' }}>{formatINR(showDetails.outstandingBalance)}</strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;