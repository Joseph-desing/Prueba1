import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, 
  IonInput, IonTextarea, IonButton, IonIcon, IonText, IonThumbnail,
  IonSelect, IonSelectOption,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { receiptOutline, addCircleOutline, camera, save, checkmarkCircle, 
         listOutline, documentText, trash } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: 'Comida' | 'Restaurante' | 'Transporte' | 'Otros';
  fotoPath: string;
  fotoUrl?: string;
  detalleRecibo: string;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel,
    IonInput, IonTextarea, IonButton, IonIcon, IonText, IonThumbnail,
    IonSelect, IonSelectOption
  ]
})
export class Tab1Page {
  descripcion: string = '';
  monto: number | null = null;
  categoria: 'Comida' | 'Restaurante' | 'Transporte' | 'Otros' = 'Otros';
  fotoCapturada: string | null = null;
  detalleRecibo: string = '';
  gastos: Gasto[] = [];

  constructor(private alertController: AlertController) {
    addIcons({
      receiptOutline,
      addCircleOutline,
      camera,
      save,
      checkmarkCircle,
      listOutline,
      documentText,
      trash
    });
    
    this.cargarGastos();
  }

  async tomarFoto() {
    if (Capacitor.getPlatform() === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        const canvas = document.createElement('canvas');
        await new Promise(resolve => video.onloadedmetadata = resolve);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        stream.getTracks().forEach(track => track.stop());
        this.fotoCapturada = canvas.toDataURL('image/png');
        this.mostrarMensaje('Foto capturada correctamente', 'success');
      } catch (err) {
        console.error(err);
        this.mostrarMensaje('Error al acceder a la cámara', 'danger');
      }
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      this.fotoCapturada = `data:image/${image.format};base64,${image.base64String}`;
      this.mostrarMensaje('Foto capturada correctamente', 'success');
    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error al capturar la foto', 'danger');
    }
  }

  async guardarGasto() {
    if (!this.descripcion || !this.monto || !this.fotoCapturada || !this.detalleRecibo) {
      this.mostrarMensaje('Por favor complete todos los campos', 'warning');
      return;
    }
    if (this.monto <= 0) {
      this.mostrarMensaje('El monto debe ser mayor a 0', 'warning');
      return;
    }

    try {
      const id = new Date().getTime().toString();
      const fecha = new Date().toISOString();
      const fotoFileName = `foto_${id}.txt`;
      await Filesystem.writeFile({
        path: fotoFileName,
        data: this.fotoCapturada,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const detalleFileName = `recibo_${id}.txt`;
      const contenidoRecibo = `
RECIBO DE GASTO
================
Descripción: ${this.descripcion}
Monto: $${this.monto}
Categoría: ${this.categoria}
Fecha: ${new Date(fecha).toLocaleString('es-EC')}
Detalle del Recibo:
${this.detalleRecibo}
================
      `.trim();

      await Filesystem.writeFile({
        path: detalleFileName,
        data: contenidoRecibo,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const nuevoGasto: Gasto = {
        id,
        descripcion: this.descripcion,
        monto: this.monto,
        categoria: this.categoria,
        fecha,
        fotoPath: fotoFileName,
        fotoUrl: this.fotoCapturada,
        detalleRecibo: this.detalleRecibo,
      };

      this.gastos.unshift(nuevoGasto);
      await this.guardarListaGastos();
      this.limpiarFormulario();
      this.mostrarMensaje('Gasto registrado exitosamente', 'success');
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      this.mostrarMensaje('Error al guardar el gasto', 'danger');
    }
  }

  async guardarListaGastos() {
    try {
      const gastosParaGuardar = this.gastos.map(g => ({ ...g, fotoUrl: undefined }));
      await Filesystem.writeFile({
        path: 'gastos.json',
        data: JSON.stringify(gastosParaGuardar),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      console.error('Error al guardar lista de gastos:', error);
    }
  }

  async cargarGastos() {
    try {
      const result = await Filesystem.readFile({
        path: 'gastos.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const gastosGuardados = JSON.parse(result.data as string);
      for (const gasto of gastosGuardados) {
        try {
          const fotoData = await Filesystem.readFile({
            path: gasto.fotoPath,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          gasto.fotoUrl = fotoData.data as string;
        } catch (error) {
          console.error('Error al cargar foto:', error);
        }
      }

      this.gastos = gastosGuardados;
    } catch (error) {
      console.log('No hay gastos previos o error al cargar:', error);
      this.gastos = [];
    }
  }

  async verDetalle(gasto: Gasto) {
    try {
      const result = await Filesystem.readFile({
        path: `recibo_${gasto.id}.txt`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const alert = await this.alertController.create({
        header: 'Detalle del Recibo',
        message: `<pre style="white-space: pre-wrap; font-size: 12px;">${result.data}</pre>`,
        buttons: ['Cerrar'],
        cssClass: 'custom-alert',
      });

      await alert.present();
    } catch (error) {
      console.error('Error al leer detalle:', error);
      this.mostrarMensaje('Error al cargar el detalle', 'danger');
    }
  }

  async eliminarGasto(gasto: Gasto) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Está seguro de eliminar este gasto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', handler: async () => {
          try {
            await Filesystem.deleteFile({ path: gasto.fotoPath, directory: Directory.Data });
            await Filesystem.deleteFile({ path: `recibo_${gasto.id}.txt`, directory: Directory.Data });
            this.gastos = this.gastos.filter(g => g.id !== gasto.id);
            await this.guardarListaGastos();
            this.mostrarMensaje('Gasto eliminado', 'success');
          } catch (error) {
            console.error('Error al eliminar:', error);
            this.mostrarMensaje('Error al eliminar el gasto', 'danger');
          }
        }},
      ],
    });

    await alert.present();
  }

  limpiarFormulario() {
    this.descripcion = '';
    this.monto = null;
    this.categoria = 'Otros';
    this.fotoCapturada = null;
    this.detalleRecibo = '';
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const alert = await this.alertController.create({
      message: mensaje,
      buttons: ['OK'],
      cssClass: `alert-${color}`,
    });
    await alert.present();
  }

  getTotalGastos(): number {
    return this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }
}
