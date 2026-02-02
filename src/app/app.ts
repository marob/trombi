import {Component, computed, signal, WritableSignal} from '@angular/core';

interface Person {
  name: string;
  city: string;
  year: string;
  image: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Config
  gridSize: WritableSignal<number> = signal(3);
  paperSize: WritableSignal<'A4' | 'A5' | 'A6'> = signal('A4');

  // Data
  trombi: WritableSignal<Person[]> = signal([]);
  imagesInError = computed(() => this.trombi().filter(i => !!i.errorMessage));
  isDragging: WritableSignal<boolean> = signal(false);

  setGridSize(size: number) {
    this.gridSize.set(size);
  }

  setPaperSize(size: 'A4' | 'A5' | 'A6') {
    this.paperSize.set(size);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.handleFiles(input.files);
    input.value = '';
  }

  handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      if (!file.type.match('image.*')) return;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imageSrc = e.target.result;
        this.processFile(file.name, imageSrc);
      };
      reader.readAsDataURL(file);
    });
  }

  processFile(filename: string, imageSrc: string) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    const regex = /^(.*)Année de 1ère inscription(.*)$/;
    const match = regex.exec(nameWithoutExt);

    let name = "";
    let city = "";
    let year = "";

    let errorMessage = '';

    if (!match || match.length !== 3) {
      console.warn(`The file ${filename} doesn't comply with the expecting regexp`);
      name = nameWithoutExt;
      errorMessage += `Le nom du fichier ne correspond pas à la convention de nommage (NOM Prénom VILLE Année de 1ère inscription AAAA)`;
    } else {
      const namePart = match[1].trim();
      const yearSuffix = match[2].trim();
      year = "Année de 1ère inscription " + yearSuffix;

      const nameTokens = namePart.split(" ");
      const m = nameTokens.length;

      if (m >= 3) {
        const lastToken = nameTokens[m - 1]; // n
        const tokenCheck = lastToken.replace("St", "ST");

        // Check if last token is essentially all uppercase (allowing St->ST exception)
        if (lastToken.toUpperCase() === tokenCheck) {
          // Possible city
          const secondLast = nameTokens[m - 2]; // o

          if (secondLast.toUpperCase() === secondLast) {
            // Two-word city (uppercase)
            name = nameTokens.slice(0, m - 2).join(" ").trim();
            city = secondLast.trim() + " " + lastToken.trim();
          } else {
            // One-word city
            name = nameTokens.slice(0, m - 1).join(" ").trim();
            city = lastToken.trim();
          }
        } else {
          name = nameTokens.join(" ").trim();
          errorMessage += `Le nom du fichier ne correspond pas à la convention de nommage (NOM Prénom VILLE Année de 1ère inscription AAAA)`;
        }
      } else {
        name = namePart;
        errorMessage += `Le nom du fichier ne correspond pas à la convention de nommage (NOM Prénom VILLE Année de 1ère inscription AAAA)`;
      }
    }

    const person: Person = {
      name,
      city,
      year,
      image: imageSrc,
      errorMessage
    };

    this.trombi.update(list => {
      const newList = [...list.filter(el => el.name !== person.name), person];
      return newList.sort((a, b) => a.name.localeCompare(b.name));
    });
  }
}
