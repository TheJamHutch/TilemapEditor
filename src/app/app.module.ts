import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { AssetsTabComponent } from './assets-tab/assets-tab.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { TilingTabComponent } from './tiling-tab/tiling-tab.component';
import { PaletteControlComponent } from './palette-control/palette-control.component';
import { EntitiesTabComponent } from './entities-tab/entities-tab.component';
import { EditorControlComponent } from './editor-control/editor-control.component';

@NgModule({
  declarations: [
    AppComponent,
    TabBarComponent,
    AssetsTabComponent,
    ToolbarComponent,
    TilingTabComponent,
    PaletteControlComponent,
    EntitiesTabComponent,
    EditorControlComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
