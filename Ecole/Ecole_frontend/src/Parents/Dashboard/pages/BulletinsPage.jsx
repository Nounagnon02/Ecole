import React, { useState } from 'react';
import { FileText, Download, AlertCircle, Loader } from 'lucide-react';
import jsPDF from "jspdf";
import 'jspdf-autotable';

const BulletinsPage = ({
    child,
    bulletin,
    loading,
    error,
    currentPeriode,
    onPeriodeChange
}) => {
    const [generatingPdf, setGeneratingPdf] = useState(false);

    if (!child) return <div>Sélectionnez un enfant</div>;

    const generatePDF = () => {
        if (!bulletin || !child) return;
        setGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const mainColor = [44, 62, 80];
            const secondaryColor = [231, 76, 60];
            const categorie = child.categorie_classe || child.categorie || 'Secondaire'; // Fallback

            // En-tête
            doc.setFontSize(16);
            doc.setTextColor(...mainColor);
            doc.setFont("helvetica", "bold");
            doc.text("COMPLEXE SCOLAIRE JACQUES-WILLIAM 1er", pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text("Établissement d'enseignement général, technique et professionnel", pageWidth / 2, 28, { align: 'center' });

            doc.setDrawColor(...mainColor);
            doc.setLineWidth(0.5);
            doc.line(15, 35, pageWidth - 15, 35);

            // Info Élève
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text("ÉLÈVE", 20, 45);
            doc.setFont("helvetica", "normal");
            doc.text(`Nom : ${child.nom || child.lastName}`, 20, 55);
            doc.text(`Prénom : ${child.prenom || child.name}`, 20, 65);
            doc.text(`Classe : ${child.classe || child.class}`, 100, 55);
            doc.text(`Année : ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, 100, 65);

            // Titre
            doc.setFontSize(14);
            doc.setTextColor(...secondaryColor);
            doc.setFont("helvetica", "bold");
            doc.text(`BULLETIN DU ${currentPeriode.toUpperCase()}`, pageWidth / 2, 90, { align: 'center' });

            let finalY = 100;
            const formatNumber = (num) => (num !== null && num !== undefined && typeof num === 'number') ? num.toFixed(2) : (num || 'N/A');

            // Tableaux selon niveau
            if (categorie.toLowerCase().includes('secondaire') && bulletin.moyennes_par_matiere) {
                const headers = ["Matière", "Coef", "Dev 1", "Dev 2", "Moyen.", "Moy. Pond.", "Rang"];
                const body = bulletin.moyennes_par_matiere.map(m => [
                    m.matiere,
                    m.coefficient,
                    formatNumber(m.details?.devoir1),
                    formatNumber(m.details?.devoir2),
                    formatNumber(m.moyenne),
                    formatNumber(m.moyenne_ponderee),
                    m.rang?.position ? `${m.rang.position}/${m.rang.total_eleves}` : 'N/A'
                ]);

                doc.autoTable({
                    startY: finalY,
                    head: [headers],
                    body: body,
                    headStyles: { fillColor: mainColor }
                });
                finalY = doc.lastAutoTable.finalY + 10;
            } else if (bulletin.evaluations) {
                // Primaire/Maternelle logic simplified
                const headers = ["Matière", "Note", "Appréciation"];
                const body = bulletin.evaluations.map(m => [
                    m.matiere,
                    // Simplification: taking first eval note or average if multiple
                    m.evaluations?.[0]?.note || 'N/A',
                    m.evaluations?.[0]?.appreciation || ''
                ]);

                doc.autoTable({
                    startY: finalY,
                    head: [headers],
                    body: body,
                    headStyles: { fillColor: mainColor }
                });
                finalY = doc.lastAutoTable.finalY + 10;
            }

            // Footer
            doc.setFontSize(10);
            doc.setTextColor(0);
            if (bulletin.moyenne_generale) {
                doc.text(`Moyenne Générale: ${formatNumber(bulletin.moyenne_generale)}`, 20, finalY + 10);
            }
            if (bulletin.rang) {
                doc.text(`Rang: ${bulletin.rang.position}/${bulletin.rang.total_eleves}`, 20, finalY + 20);
            }

            doc.save(`Bulletin_${child.prenom}_${child.nom}.pdf`);

        } catch (err) {
            console.error(err);
            alert("Erreur lors de la génération du PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div className="bulletins-container">
            <div className="filters-bar card p-4 mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="form-group">
                    <label>Période:</label>
                    <select
                        className="form-input"
                        value={currentPeriode}
                        onChange={(e) => onPeriodeChange(e.target.value)}
                    >
                        <option value="Semestre 1">Semestre 1</option>
                        <option value="Semestre 2">Semestre 2</option>
                    </select>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={generatePDF}
                    disabled={loading || !bulletin || error}
                >
                    {generatingPdf ? <Loader className="spin" size={18} /> : <Download size={18} />}
                    Télécharger PDF
                </button>
            </div>

            {loading ? (
                <div className="loading-state text-center p-5">
                    <Loader className="spin text-primary" size={40} />
                    <p>Chargement du bulletin...</p>
                </div>
            ) : error ? (
                <div className="error-state text-center p-5 card">
                    <AlertCircle className="text-danger" size={40} />
                    <p className="text-danger mt-2">{error}</p>
                </div>
            ) : !bulletin ? (
                <div className="empty-state text-center p-5 card">
                    <FileText size={40} className="text-muted" />
                    <p>Aucun bulletin disponible pour cette période.</p>
                </div>
            ) : (
                <div className="bulletin-preview card p-0 overflow-hidden">
                    <div className="p-4 bg-light border-bottom">
                        <h3 className="m-0 text-center">Bulletin - {child.prenom} {child.nom}</h3>
                        <p className="text-center text-muted m-0">{currentPeriode}</p>
                    </div>
                    {/* Simplified HTML Preview */}
                    <div className="table-responsive p-4">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Matière</th>
                                    <th>Moyenne</th>
                                    <th>Rang</th>
                                    <th>Appréciation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bulletin.moyennes_par_matiere?.map((m, idx) => (
                                    <tr key={idx}>
                                        <td>{m.matiere}</td>
                                        <td><strong>{typeof m.moyenne === 'number' ? m.moyenne.toFixed(2) : m.moyenne}</strong></td>
                                        <td>{m.rang?.position ? `${m.rang.position}/${m.rang.total_eleves}` : '-'}</td>
                                        <td>{m.appreciation || '-'}</td>
                                    </tr>
                                )) || bulletin.evaluations?.map((m, idx) => (
                                    <tr key={idx}>
                                        <td>{m.matiere}</td>
                                        <td>{m.evaluations?.[0]?.note || '-'}</td>
                                        <td>-</td>
                                        <td>{m.evaluations?.[0]?.appreciation || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-light border-top">
                        <div className="d-flex justify-content-between">
                            <div>
                                <strong>Moyenne Générale: </strong>
                                <span className={`badge ${bulletin.moyenne_generale >= 10 ? 'badge-success' : 'badge-danger'}`}>
                                    {bulletin.moyenne_generale ? Number(bulletin.moyenne_generale).toFixed(2) : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <strong>Rang: </strong>
                                {bulletin.rang?.position ? `${bulletin.rang.position} / ${bulletin.rang.total_eleves}` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulletinsPage;
