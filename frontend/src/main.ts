import 'zone.js';
import '@angular/compiler';
import './winbox-loader';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

try {
  bootstrapApplication(AppComponent)
    .catch((err) => {
      console.error(err);
      document.body.innerHTML = `<h1 style="color:red;">Error: ${err.message}</h1>`;
    });
} catch (err: any) {
  console.error(err);
  document.body.innerHTML = `<h1 style="color:red;">Error: ${err.message}</h1>`;
}
