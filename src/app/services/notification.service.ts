import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationMessage {
  type: 'success' | 'error';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationMessage | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  showSuccess(message: string, duration: number = 5000) {
    this.showNotification({
      type: 'success',
      message,
      duration
    });
  }

  showError(message: string, duration: number = 5000) {
    this.showNotification({
      type: 'error',
      message,
      duration
    });
  }

  private showNotification(notification: NotificationMessage) {
    this.notificationSubject.next(notification);
    
    // Masquer automatiquement après la durée spécifiée
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.hideNotification();
      }, notification.duration);
    }
  }

  hideNotification() {
    this.notificationSubject.next(null);
  }
}
