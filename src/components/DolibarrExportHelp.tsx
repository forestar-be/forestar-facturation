"use client";

import { useState } from "react";
import { HelpCircle, X, ExternalLink } from "lucide-react";

// Libellés relevés dans Dolibarr 22.0.4 de production (gestion.forestar.be), 7 oct. 2026.
const DOLIBARR_EXPORT_URL =
  "https://gestion.forestar.be/exports/export.php?step=2&module_position=11&datatoexport=facture_1";

const FIELDS_WITHOUT_PROFILE: { object: string; field: string; why: string }[] = [
  { object: "Facture", field: "Réf. facture", why: "obligatoire" },
  { object: "Société", field: "Raison sociale", why: "obligatoire (le client)" },
  { object: "Facture", field: "Total TTC", why: "obligatoire" },
  { object: "Facture", field: "Type", why: "pour reconnaître avoirs et acomptes" },
  { object: "Facture", field: "Date facturation", why: "pour départager les paiements" },
  { object: "Facture", field: "Mode de règlement (id)", why: "pour écarter les espèces" },
];

interface DolibarrExportHelpProps {
  className?: string;
}

export default function DolibarrExportHelp({ className = "" }: DolibarrExportHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline ${className}`}
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        Comment exporter depuis Dolibarr ?
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[60] p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dolibarr-export-help-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 id="dolibarr-export-help-title" className="text-lg font-medium text-gray-900">
                Exporter les factures depuis Dolibarr
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm text-gray-700">
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Avec le profil (recommandé)</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Ouvrez l&apos;export des factures dans Dolibarr :{" "}
                    <a
                      href={DOLIBARR_EXPORT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline"
                    >
                      gestion.forestar.be — Factures clients et règlements
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                    <br />
                    <span className="text-gray-500">
                      (ou menu <strong>Outils</strong> → <strong>Nouvel export</strong> → ligne{" "}
                      <strong>Factures et avoirs — Factures clients et règlements</strong>)
                    </span>
                  </li>
                  <li>
                    En haut, dans <em>« choisissez un profil d&apos;export prédéfini »</em>, prenez{" "}
                    <strong>Rapprochement Forestar</strong> puis cliquez sur <strong>Sélectionner</strong>.
                  </li>
                  <li>
                    Cliquez sur <strong>Étape suivante</strong> (en bas de page).
                  </li>
                  <li>
                    Sur la ligne <strong>Date facturation</strong>, saisissez l&apos;année, par exemple{" "}
                    <code className="px-1 bg-gray-100 rounded">2026</code>, ou la période de votre extrait
                    bancaire, par exemple{" "}
                    <code className="px-1 bg-gray-100 rounded">20250512+20260511</code>. Puis{" "}
                    <strong>Étape suivante</strong>, et encore <strong>Étape suivante</strong>.
                  </li>
                  <li>
                    Laissez le format <strong>CSV ISO-8859-1</strong> (ou <strong>CSV UTF-8</strong>), cliquez sur{" "}
                    <strong>Générer</strong>, puis sur le fichier <strong>export_facture_1.csv</strong> qui apparaît
                    pour le télécharger.
                  </li>
                  <li>Déposez ce fichier ici, dans « Fichier Factures ».</li>
                </ol>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">Sans le profil</h4>
                <p className="mb-2">
                  Même chemin, mais à l&apos;étape 2 cliquez sur la flèche de chacun de ces champs pour les
                  faire passer dans <em>« Champs à exporter »</em> :
                </p>
                <table className="w-full border border-gray-200 rounded">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Object</th>
                      <th className="px-3 py-2 font-medium">Champ</th>
                      <th className="px-3 py-2 font-medium">Pourquoi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIELDS_WITHOUT_PROFILE.map((f) => (
                      <tr key={f.field} className="border-t border-gray-200">
                        <td className="px-3 py-1.5">{f.object}</td>
                        <td className="px-3 py-1.5 font-medium">{f.field}</td>
                        <td className="px-3 py-1.5 text-gray-500">{f.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2">Puis suivez les étapes 3 à 6 ci-dessus.</p>
              </section>

              <section className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p>
                  Le fichier attendu est un <strong>CSV</strong> de Dolibarr. Les factures payées en espèces sont
                  ignorées, les avoirs et les acomptes sont reconnus automatiquement.
                </p>
              </section>
            </div>

            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
