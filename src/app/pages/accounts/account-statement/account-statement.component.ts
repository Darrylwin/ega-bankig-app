import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AccountApiService } from '../../../@core/data/api/index';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-account-statement',
  templateUrl: './account-statement.component.html',
  styleUrls: ['./account-statement.component.scss']
})
export class AccountStatementComponent implements OnInit {
  accountId: number = 0;
  startDate: string = '';
  endDate: string = '';
  format: string = 'pdf';
  includeLogo: boolean = true;
  includeAllTransactions: boolean = true;
  includeSummary: boolean = true;
  isGenerating = false;

  constructor(
    private route: ActivatedRoute,
    private accountApi: AccountApiService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.accountId = +this.route.snapshot.params['id'];
    this.setCurrentMonth(); // Par défaut : ce mois
  }

  /**
   * Génère le relevé
   */
  generateStatement(): void {
    if (!this.startDate || !this.endDate) {
      this.toastr.warning('Veuillez sélectionner une période', 'Attention');
      return;
    }

    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.toastr.warning('La date de début doit être avant la date de fin', 'Erreur');
      return;
    }

    this.isGenerating = true;

    // Convertir en format ISO complet
    const startISO = `${this.startDate}T00:00:00`;
    const endISO = `${this.endDate}T23:59:59`;

    this.accountApi.generateStatement(this.accountId, startISO, endISO).subscribe({
      next: (blob) => {
        this.isGenerating = false;
        
        // Télécharger le fichier
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Nom du fichier selon le format
        let extension = this.format;
        let mimeType = 'application/pdf';
        
        if (this.format === 'csv') {
          mimeType = 'text/csv';
        } else if (this.format === 'html') {
          mimeType = 'text/html';
        }
        
        a.download = `releve_compte_${this.accountId}_${this.startDate}_${this.endDate}.${extension}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.toastr.success('Relevé généré avec succès', 'Succès');
      },
      error: (error) => {
        this.isGenerating = false;
        this.toastr.danger('Erreur lors de la génération du relevé', 'Erreur');
      }
    });
  }

  /**
   * Périodes prédéfinies
   */
  setCurrentMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  setLastMonth(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = lastDay.toISOString().split('T')[0];
  }

  setLast30Days(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  setLast90Days(): void {
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    
    this.startDate = ninetyDaysAgo.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  setLastYear(): void {
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    this.startDate = lastYear.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDateDisplay(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }
}