import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  baseUrl: string = "https://teeq-api-staging.azurewebsites.net"

  constructor() { }
}
