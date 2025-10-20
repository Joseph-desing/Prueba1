import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel,
  IonSelect, IonSelectOption, IonButton, IonText, IonIcon
} from '@ionic/angular/standalone';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { addIcons } from 'ionicons';
import { calendar, listOutline } from 'ionicons/icons';

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: 'Comida' | 'Restaurante' | 'Transporte' | 'Otros';
  detalleRecibo: string;
  fotoPath: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonText, IonIcon
  ]
})
export class Tab4Page {
  gastos: Gasto[] = [];
  mes: number = new Date().getMonth() + 1;
  anio: number = new Date().getFullYear();
  resumen: Record<string, number> = {};

  constructor() {
    addIcons({ calendar, listOutline });
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
      this.generarResumen();
    } catch (error) {
      console.log('No hay gastos previos o error al cargar:', error);
      this.gastos = [];
      this.resumen = {};
    }
  }

  generarResumen() {
    // Inicializar categorías
    this.resumen = {
      'Comida': 0,
      'Restaurante': 0,
      'Transporte': 0,
      'Otros': 0
    };

    const gastosFiltrados = this.gastos.filter(g => {
      const fechaGasto = new Date(g.fecha);
      return fechaGasto.getMonth() + 1 === this.mes && fechaGasto.getFullYear() === this.anio;
    });

    for (const gasto of gastosFiltrados) {
      if (this.resumen[gasto.categoria] !== undefined) {
        this.resumen[gasto.categoria] += gasto.monto;
      }
    }
  }

  cambiarFecha() {
    this.generarResumen();
  }

  getTotal(): number {
    return Object.values(this.resumen).reduce((acc, val) => acc + val, 0);
  }
}
