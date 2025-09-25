import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationSelector from './LocationSelector';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function ContractForm() {
  const [formData, setFormData] = useState({
    name: '',
    memberEmails: '',
    startDate: '',
    endDate: '',
    totalSeats: 4,
    autoPostExtraSeats: false,
    startLocation: '',
    endLocation: '',
    schedule: [
      { day: 'Monday', time: '', enabled: false },
      { day: 'Tuesday', time: '', enabled: false },
      { day: 'Wednesday', time: '', enabled: false },
      { day: 'Thursday', time: '', enabled: false },
      { day: 'Friday', time: '', enabled: false },
      { day: 'Saturday', time: '', enabled: false },
      { day: 'Sunday', time: '', enabled: false }
    ]
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contract name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Contract name must be at least 3 characters';
    }

    if (!formData.memberEmails.trim()) {
      newErrors.memberEmails = 'At least one member email is required';
    } else {
      const emails = formData.memberEmails.split(',').map(email => email.trim()).filter(email => email);
      if (emails.length === 0) {
        newErrors.memberEmails = 'At least one valid email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter(email => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
          newErrors.memberEmails = `Invalid email format: ${invalidEmails.join(', ')}`;
        }
      }
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.startLocation || !formData.startLocation.address || !formData.startLocation.address.trim()) {
      newErrors.startLocation = 'Start location is required';
    }

    if (!formData.endLocation || !formData.endLocation.address || !formData.endLocation.address.trim()) {
      newErrors.endLocation = 'End location is required';
    }

    if (formData.startLocation?.address && formData.endLocation?.address && 
        formData.startLocation.address.trim().toLowerCase() === formData.endLocation.address.trim().toLowerCase()) {
      newErrors.endLocation = 'Start and end locations cannot be the same';
    }

    if (formData.totalSeats < 2) {
      newErrors.totalSeats = 'Total seats must be at least 2';
    } else if (formData.totalSeats > 20) {
      newErrors.totalSeats = 'Total seats cannot exceed 20';
    }

    const weeklySchedule = formData.schedule.filter(s => s.enabled && s.time);
    if (weeklySchedule.length === 0) {
      newErrors.schedule = 'Please select at least one day and time for the schedule';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const emails = formData.memberEmails.split(',').map(email => email.trim()).filter(email => email);
      const weeklySchedule = formData.schedule.filter(s => s.enabled && s.time);

      if (!formData.startLocation?.address || !formData.endLocation?.address) {
        setErrors({ general: 'Please select both start and end locations' });
        setLoading(false);
        return;
      }

      const memberUserIds = [];
      const token = localStorage.getItem('token') || '';

      if (!token) {
        setErrors({ general: 'Authentication required. Please login again.' });
        setLoading(false);
        return;
      }

      for (const email of emails) {
        try {
          const { data } = await axios.get(`${API}/api/auth/user-by-email/${email}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          memberUserIds.push(data._id);
        } catch (error) {
          if (error.response?.status === 404) {
            setErrors({ memberEmails: `User with email ${email} not found. Please check the email or ask them to register first.` });
          } else {
            setErrors({ general: `Error finding user ${email}: ${error.response?.data?.message || error.message}` });
          }
          setLoading(false);
          return;
        }
      }

      if (memberUserIds.length > formData.totalSeats) {
        setErrors({ totalSeats: `Total seats (${formData.totalSeats}) must be at least equal to the number of members (${memberUserIds.length})` });
        setLoading(false);
        return;
      }

      const contractData = {
        name: formData.name.trim(),
        memberIds: memberUserIds,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalSeats: formData.totalSeats,
        autoPostExtraSeats: formData.autoPostExtraSeats,
        route: {
          startLocation: { 
            address: formData.startLocation?.address?.trim() || '' 
          },
          endLocation: { 
            address: formData.endLocation?.address?.trim() || '' 
          }
        },
        weeklySchedule: weeklySchedule.map(s => ({
          day: s.day,
          time: s.time
        }))
      };

      const response = await axios.post(`${API}/api/contracts`, contractData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201) {
        navigate('/contracts');
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred while creating the contract';
      
      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid contract data. Please check all fields.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please login again.';
            break;
          case 403:
            errorMessage = 'You are not authorized to create contracts.';
            break;
          case 404:
            errorMessage = 'Some required resources were not found.';
            break;
          case 500:
            errorMessage = 'Server error occurred. Please try again later.';
            break;
          default:
            errorMessage = data.message || `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message || 'An error occurred while processing your request.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setFormData({ ...formData, schedule: newSchedule });
    
    if (errors.schedule) {
      setErrors(prev => ({ ...prev, schedule: null }));
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const isFormValid = () => {
    const hasStartLocation = formData.startLocation && 
                           formData.startLocation.address && 
                           formData.startLocation.address.trim();
    
    const hasEndLocation = formData.endLocation && 
                          formData.endLocation.address && 
                          formData.endLocation.address.trim();
    
    return formData.name.trim() && 
           formData.startDate && 
           formData.endDate && 
           hasStartLocation && 
           hasEndLocation && 
           formData.memberEmails.trim() &&
           formData.schedule.some(s => s.enabled && s.time);
  };

  return (
    <div style={{marginTop:12}}>
      <h2 style={{marginTop:0}}>Create Ride Contract</h2>
      
      {errors.general && (
        <div className="form-error">
          <strong>Error:</strong> {errors.general}
        </div>
      )}

      <div style={{marginBottom: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 14}}>
        💡 <strong>Location Selection:</strong> Click the "🗺️ Select on Map" button for each location to open the map and select your start and end points.
      </div>

      <form className="card pad" onSubmit={handleSubmit}>
        <div className="row two">
          <div>
            <label className="label">Contract Name *</label>
            <input 
              className={`input ${errors.name ? 'error' : ''}`}
              type="text" 
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                clearError('name');
              }}
              onBlur={() => validateForm()}
              placeholder="Enter contract name"
            />
            {errors.name && <div className="validation-error">{errors.name}</div>}
          </div>
          <div>
            <label className="label">Total Seats *</label>
            <input 
              className={`input ${errors.totalSeats ? 'error' : ''}`}
              type="number" 
              min="2" 
              max="20"
              value={formData.totalSeats}
              onChange={(e) => {
                setFormData({...formData, totalSeats: parseInt(e.target.value) || 2});
                clearError('totalSeats');
              }}
              onBlur={() => validateForm()}
            />
            {errors.totalSeats && <div className="validation-error">{errors.totalSeats}</div>}
          </div>
        </div>

        <div className="row two">
          <div>
            <label className="label">Start Date *</label>
            <input 
              className={`input ${errors.startDate ? 'error' : ''}`}
              type="date" 
              value={formData.startDate}
              onChange={(e) => {
                setFormData({...formData, startDate: e.target.value});
                clearError('startDate');
              }}
              onBlur={() => validateForm()}
            />
            {errors.startDate && <div className="validation-error">{errors.startDate}</div>}
          </div>
          <div>
            <label className="label">End Date *</label>
            <input 
              className={`input ${errors.endDate ? 'error' : ''}`}
              type="date" 
              value={formData.endDate}
              onChange={(e) => {
                setFormData({...formData, endDate: e.target.value});
                clearError('endDate');
              }}
              onBlur={() => validateForm()}
            />
            {errors.endDate && <div className="validation-error">{errors.endDate}</div>}
          </div>
        </div>

        <div className="row two">
          <LocationSelector
            label="Start Location *"
            value={formData.startLocation}
            onChange={(location) => {
              setFormData({...formData, startLocation: location});
              if (errors.startLocation) {
                setErrors(prev => ({ ...prev, startLocation: null }));
              }
            }}
            placeholder="Click the map button to select start location"
            required
            error={errors.startLocation}
          />
          <LocationSelector
            label="End Location *"
            value={formData.endLocation}
            onChange={(location) => {
              setFormData({...formData, endLocation: location});
              if (errors.endLocation) {
                setErrors(prev => ({ ...prev, endLocation: null }));
              }
            }}
            placeholder="Click the map button to select end location"
            required
            error={errors.endLocation}
          />
        </div>

        <div>
          <label className="label">Member Emails (comma-separated) *</label>
          <textarea 
            className={`input ${errors.memberEmails ? 'error' : ''}`}
            rows="3"
            placeholder="email1@example.com, email2@example.com"
            value={formData.memberEmails}
            onChange={(e) => {
              setFormData({...formData, memberEmails: e.target.value});
              clearError('memberEmails');
            }}
            onBlur={() => validateForm()}
          />
          {errors.memberEmails && <div className="validation-error">{errors.memberEmails}</div>}
        </div>

        <div>
          <label className="label">Weekly Schedule *</label>
          {errors.schedule && <div className="validation-error">{errors.schedule}</div>}
          {formData.schedule.map((day, index) => (
            <div key={day.day} style={{display:"flex", gap:10, alignItems:"center", marginBottom:8}}>
              <input 
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => updateSchedule(index, 'enabled', e.target.checked)}
              />
              <span style={{width: 100}}>{day.day}</span>
              <input 
                className="input"
                type="time"
                style={{width: 120}}
                value={day.time}
                onChange={(e) => updateSchedule(index, 'time', e.target.value)}
                disabled={!day.enabled}
              />
            </div>
          ))}
        </div>

        <div style={{display:"flex", alignItems:"center", gap:10, marginTop:16}}>
          <input 
            type="checkbox"
            checked={formData.autoPostExtraSeats}
            onChange={(e) => setFormData({...formData, autoPostExtraSeats: e.target.checked})}
          />
          <label>Auto-post extra seats as public rides</label>
        </div>

        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button 
            className="btn primary" 
            type="submit" 
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Creating...' : 'Create Contract'}
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('/contracts')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
