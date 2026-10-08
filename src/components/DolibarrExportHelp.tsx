"use client";

import { useState } from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@forestar-be/ui";

// Libellés relevés dans Dolibarr 22.0.4 de production (gestion.forestar.be), 7 oct. 2026.
const DOLIBARR_EXPORT_URL =
  "https://gestion.forestar.be/exports/export.php?step=2&module_position=11&datatoexport=facture_1";

const FIELDS_WITHOUT_PROFILE: { object: string; field: string; why: string }[] =
  [
    { object: "Facture", field: "Réf. facture", why: "obligatoire" },
    {
      object: "Société",
      field: "Raison sociale",
      why: "obligatoire (le client)",
    },
    { object: "Facture", field: "Total TTC", why: "obligatoire" },
    {
      object: "Facture",
      field: "Type",
      why: "pour reconnaître avoirs et acomptes",
    },
    {
      object: "Facture",
      field: "Date facturation",
      why: "pour départager les paiements",
    },
    {
      object: "Facture",
      field: "Mode de règlement (id)",
      why: "obligatoire (seuls les virements sont rapprochés)",
    },
  ];

interface DolibarrExportHelpProps {
  className?: string;
}

export default function DolibarrExportHelp({
  className = "",
}: DolibarrExportHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <HelpCircle />
        Comment exporter depuis Dolibarr ?
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[min(92vw,42rem)]">
          <DialogHeader>
            <DialogTitle>Exporter les factures depuis Dolibarr</DialogTitle>
          </DialogHeader>

          <div className="min-w-0 space-y-6 text-sm">
            <section>
              <h4 className="mb-2 font-semibold">
                Avec le profil (recommandé)
              </h4>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Ouvrez l&apos;export des factures dans Dolibarr :{" "}
                  <a
                    href={DOLIBARR_EXPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    gestion.forestar.be — Factures clients et règlements
                    <ExternalLink className="size-3" />
                  </a>
                  <br />
                  <span className="text-muted-foreground">
                    (ou menu <strong>Outils</strong> →{" "}
                    <strong>Nouvel export</strong> → ligne{" "}
                    <strong>
                      Factures et avoirs — Factures clients et règlements
                    </strong>
                    )
                  </span>
                </li>
                <li>
                  En haut, dans{" "}
                  <em>« choisissez un profil d&apos;export prédéfini »</em>,
                  prenez <strong>Rapprochement Forestar</strong> puis cliquez
                  sur <strong>Sélectionner</strong>.
                </li>
                <li>
                  Cliquez sur <strong>Étape suivante</strong> (en bas de page).
                </li>
                <li>
                  Sur la ligne <strong>Date facturation</strong>, saisissez
                  l&apos;année, par exemple{" "}
                  <code className="rounded bg-muted px-1">2026</code>, ou la
                  période de votre extrait bancaire, par exemple{" "}
                  <code className="rounded bg-muted px-1">
                    20250512+20260511
                  </code>
                  . Sur la ligne <strong>Mode de règlement (id)</strong>,
                  saisissez <code className="rounded bg-muted px-1">2</code>{" "}
                  (virement bancaire). Puis <strong>Étape suivante</strong>, et
                  encore <strong>Étape suivante</strong>.
                </li>
                <li>
                  Laissez le format <strong>CSV ISO-8859-1</strong> (ou{" "}
                  <strong>CSV UTF-8</strong>), cliquez sur{" "}
                  <strong>Générer</strong>, puis sur le fichier{" "}
                  <strong>export_facture_1.csv</strong> qui apparaît pour le
                  télécharger.
                </li>
                <li>
                  Déposez ce fichier ici, dans l&apos;onglet « Fichier CSV » de
                  la carte « Factures ».
                </li>
              </ol>
            </section>

            <section>
              <h4 className="mb-2 font-semibold">Sans le profil</h4>
              <p className="mb-2">
                Même chemin, mais à l&apos;étape 2 cliquez sur la flèche de
                chacun de ces champs pour les faire passer dans{" "}
                <em>« Champs à exporter »</em> :
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Object</TableHead>
                    <TableHead>Champ</TableHead>
                    <TableHead>Pourquoi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FIELDS_WITHOUT_PROFILE.map((f) => (
                    <TableRow key={f.field}>
                      <TableCell>{f.object}</TableCell>
                      <TableCell className="font-medium">{f.field}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {f.why}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2">Puis suivez les étapes 3 à 6 ci-dessus.</p>
            </section>

            <section className="rounded-lg border border-info/25 bg-info/10 p-3">
              <p>
                Le fichier attendu est un <strong>CSV</strong> de Dolibarr.
                Seules les factures réglées par <strong>virement</strong> sont
                rapprochées : celles payées par carte, en espèces ou par chèque
                n&apos;arrivent pas une à une sur le compte et sont ignorées,
                même si vous oubliez le filtre de l&apos;étape 4. Les avoirs et
                les acomptes sont reconnus automatiquement.
              </p>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
