import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { DemoComponent } from './demo/demo.component';

@NgModule({
  declarations: [],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule, AppComponent, DemoComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
