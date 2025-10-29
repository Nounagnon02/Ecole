import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormField = ({ 
  field, 
  value, 
  onChange, 
  error, 
  disabled = false 
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleChange = (e) => {
    const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(field.name, newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
      case 'time':
        return (
          <input
            type={field.type}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            className={`form-input ${error ? 'error' : ''}`}
            required={field.required}
          />
        );

      case 'password':
        return (
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              name={field.name}
              value={value || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`form-input ${error ? 'error' : ''}`}
              required={field.required}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={field.rows || 3}
            className={`form-input ${error ? 'error' : ''}`}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
            required={field.required}
          >
            <option value="">{field.placeholder || 'Sélectionner...'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="checkbox-field">
            <input
              type="checkbox"
              name={field.name}
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className="checkbox-input"
              required={field.required}
            />
            <label className="checkbox-label">{field.label}</label>
          </div>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option) => (
              <div key={option.value} className="radio-field">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled}
                  className="radio-input"
                  required={field.required}
                />
                <label className="radio-label">{option.label}</label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            onChange={handleChange}
            disabled={disabled}
            accept={field.accept}
            multiple={field.multiple}
            className={`form-input ${error ? 'error' : ''}`}
            required={field.required}
          />
        );

      default:
        return (
          <input
            type="text"
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className={`form-group ${field.className || ''}`}>
      {field.type !== 'checkbox' && field.label && (
        <label className="form-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {field.help && (
        <div className="form-help">{field.help}</div>
      )}
      
      {error && (
        <div className="form-error">{error}</div>
      )}
    </div>
  );
};

const FormBuilder = ({
  fields = [],
  values = {},
  errors = {},
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
  submitText = 'Enregistrer',
  cancelText = 'Annuler',
  onCancel,
  className = '',
  layout = 'vertical' // 'vertical' | 'horizontal' | 'grid'
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(values);
    }
  };

  const getLayoutClass = () => {
    switch (layout) {
      case 'horizontal':
        return 'form-horizontal';
      case 'grid':
        return 'form-grid';
      default:
        return 'form-vertical';
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`form-builder ${getLayoutClass()} ${className}`}
    >
      <div className="form-fields">
        {fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={onChange}
            error={errors[field.name]}
            disabled={disabled || loading}
          />
        ))}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
          >
            {cancelText}
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || disabled}
          className="btn btn-primary"
        >
          {loading ? 'Chargement...' : submitText}
        </button>
      </div>

      <style jsx>{`
        .form-builder {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-vertical .form-fields {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-horizontal .form-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .form-horizontal .form-group {
          flex: 1;
          min-width: 200px;
        }

        .form-grid .form-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .required {
          color: #e53e3e;
          margin-left: 0.25rem;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .form-input.error {
          border-color: #e53e3e;
        }

        .form-input:disabled {
          background-color: #f7fafc;
          color: #718096;
          cursor: not-allowed;
        }

        .password-field {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #718096;
          cursor: pointer;
          padding: 0.25rem;
        }

        .checkbox-field,
        .radio-field {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .checkbox-input,
        .radio-input {
          margin: 0;
        }

        .checkbox-label,
        .radio-label {
          margin: 0;
          cursor: pointer;
          font-weight: normal;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-help {
          margin-top: 0.25rem;
          font-size: 0.8rem;
          color: #718096;
        }

        .form-error {
          margin-top: 0.25rem;
          font-size: 0.8rem;
          color: #e53e3e;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 768px) {
          .form-horizontal .form-fields {
            flex-direction: column;
          }
          
          .form-grid .form-fields {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </form>
  );
};

export default FormBuilder;