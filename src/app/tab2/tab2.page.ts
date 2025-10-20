import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
         IonCardTitle, IonCardContent, IonItem, IonLabel, IonText, IonIcon } from '@ionic/angular/standalone';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { statsChartOutline, listOutline, calculatorOutline, alertCircleOutline } from 'ionicons/icons';

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  fotoPath: string;
  fotoUrl?: string;
  detalleRecibo: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonText, IonIcon
  ]
})
export class Tab2Page {
  gastos: Gasto[] = [];

  constructor() {
    addIcons({
      statsChartOutline,
      listOutline,
      calculatorOutline,
      alertCircleOutline
    });

    this.cargarGastos();
  }

  async cargarGastos() {
    try {
      const result = await Filesystem.readFile({
        path: 'gastos.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      this.gastos = JSON.parse(result.data as string);
    } catch (error) {
      console.log('No hay gastos previos o error al cargar:', error);
      this.gastos = [];
    }
  }

  getTotalGastos(): number {
    return this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  getPromedioGasto(): number {
    if (this.gastos.length === 0) return 0;
    return this.getTotalGastos() / this.gastos.length;
  }
}
