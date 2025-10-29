import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Eye, ChevronUp, ChevronDown, Search } from 'lucide-react';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  sortable = true,
  pagination = true,
  itemsPerPage = 10,
  emptyMessage = "Aucune donnée disponible",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrage des données
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      columns.some(column => {
        const value = column.accessor ? item[column.accessor] : '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Tri des données
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.accessor], item);
    }
    return item[column.accessor] || '-';
  };

  const renderActions = (item) => {
    return (
      <div className="table-actions">
        {onView && (
          <button
            onClick={() => onView(item)}
            className="btn btn-sm btn-secondary"
            title="Voir"
          >
            <Eye size={14} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="btn btn-sm btn-edit"
            title="Modifier"
          >
            <Edit2 size={14} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item)}
            className="btn btn-sm btn-danger"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      {searchable && (
        <div className="table-header">
          <div className="search-container">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      )}

      {paginatedData.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      onClick={() => handleSort(column.accessor)}
                      className={`${sortable && column.sortable !== false ? 'sortable' : ''} ${
                        sortConfig.key === column.accessor ? 'sorted' : ''
                      }`}
                    >
                      <div className="th-content">
                        {column.header}
                        {sortable && column.sortable !== false && getSortIcon(column.accessor)}
                      </div>
                    </th>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <th className="actions-header">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item.id || index}>
                    {columns.map((column) => (
                      <td key={column.key} className={column.className || ''}>
                        {renderCell(item, column)}
                      </td>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <td className="actions-cell">
                        {renderActions(item)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-sm btn-secondary"
              >
                Précédent
              </button>
              
              <div className="pagination-info">
                Page {currentPage} sur {totalPages} ({sortedData.length} éléments)
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-secondary"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .data-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-header {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .search-container {
          position: relative;
          max-width: 300px;
        }

        .search-container svg {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #718096;
        }

        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table th {
          background-color: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }

        .data-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .data-table th.sortable:hover {
          background-color: #edf2f7;
        }

        .th-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .data-table tr:hover {
          background-color: #f7fafc;
        }

        .table-actions {
          display: flex;
          gap: 0.25rem;
        }

        .actions-header,
        .actions-cell {
          width: 120px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .pagination-info {
          font-size: 0.9rem;
          color: #718096;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #718096;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DataTable;