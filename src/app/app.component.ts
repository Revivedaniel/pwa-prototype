import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  message = '';
  messages: { type: string, data: string }[] = [];
  imageCaptureActive = false;
  videoRecording = false;
  videoStream: MediaStream | null = null;
  videoRecorder: MediaRecorder | null = null;
  videoChunks: BlobPart[] = [];

  constructor(private http: HttpClient) {}
  
  sendMessage() {
    if (this.message) {
      this.messages.push({type: 'txt', data: this.message});
      this.http.post('/api/messages', { text: this.message }).subscribe();
      this.message = '';
    }
  }
  
  async startCaptureImage() {
    this.imageCaptureActive = true;
    this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  }
  
  captureImage() {
    if (!this.videoStream) return;
    const video = document.createElement('video');
    video.srcObject = this.videoStream;
    video.play();
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    
    this.videoStream.getTracks().forEach(track => track.stop());
    this.imageCaptureActive = false;
    
    const imageData = canvas.toDataURL('image/png');
    this.messages.push({ type: 'image', data: imageData });
    
    canvas.toBlob(blob => {
      if (blob) {
        this.uploadMedia(blob);
      }
    }, 'image/png');
  }
  
  async startCaptureVideo() {
    this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.videoRecorder = new MediaRecorder(this.videoStream);
    this.videoChunks = [];
    this.videoRecording = true;
    
    this.videoRecorder.ondataavailable = event => this.videoChunks.push(event.data);
    
    this.videoRecorder.start();
  }
  
  stopCaptureVideo() {
    if (!this.videoRecorder || !this.videoStream) return;
    
    this.videoRecorder.stop();
    this.videoStream.getTracks().forEach(track => track.stop());
    this.videoRecording = false;
    
    this.videoRecorder.onstop = () => {
      const blob = new Blob(this.videoChunks, { type: 'video/mp4' });
      const videoURL = URL.createObjectURL(blob);
      // this.messages.push({ type: 'video', data: videoURL });
      this.uploadMedia(blob);
    };
  }
  
  uploadMedia(blob: Blob | null) {
    if (!blob) return;
    const formData = new FormData();
    formData.append('file', blob, 'upload.mp4');
    this.http.post('/api/upload', formData).subscribe();
  }
}
