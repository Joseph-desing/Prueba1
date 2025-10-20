import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
         IonCardTitle, IonCardContent, IonItem, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { addIcons } from 'ionicons';
import { listOutline, documentTextOutline, downloadOutline, alertCircleOutline, eyeOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';

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
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonButton, IonIcon
  ]
})
export class Tab3Page {
  gastos: Gasto[] = [];

  constructor() {
    addIcons({
      listOutline,
      documentTextOutline,
      downloadOutline,
      alertCircleOutline,
      eyeOutline
    });

    this.cargarGastos();
  }

  async cargarGastos() {
    try {
      const result = await Filesystem.readFile({
        path: 'gastos.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
      this.gastos = JSON.parse(result.data as string);
    } catch (error) {
      console.log('No hay gastos previos o error al cargar:', error);
      this.gastos = [];
    }
  }

  async verDetalle(gasto: Gasto) {
    // Igual que en Tab1: mostrar un alert con el detalle del recibo
    try {
      const result = await Filesystem.readFile({
        path: `recibo_${gasto.id}.txt`,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

      alert(result.data); // Simple para web/móvil, puedes usar AlertController si quieres estilo Ionic
    } catch (error) {
      console.error('Error al leer detalle:', error);
      alert('Error al cargar el detalle');
    }
  }

  async descargarRecibo(gasto: Gasto) {
    try {
      const contenidoRecibo = `
RECIBO DE GASTO
================
Descripción: ${gasto.descripcion}
Monto: $${gasto.monto.toFixed(2)}
Fecha: ${new Date(gasto.fecha).toLocaleString('es-EC')}
Detalle del Recibo:
${gasto.detalleRecibo}
================
      `.trim();

      if (Capacitor.getPlatform() === 'web') {
        // Descarga en navegador
        const blob = new Blob([contenidoRecibo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_${gasto.id}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Guardar en dispositivo móvil
        const fileName = `recibo_${gasto.id}.txt`;
        await Filesystem.writeFile({
          path: fileName,
          data: contenidoRecibo,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        alert(`Recibo guardado en Documents/${fileName}`);
      }
    } catch (error) {
      console.error('Error al generar recibo:', error);
      alert('Error al generar el recibo');
    }
  }
}
