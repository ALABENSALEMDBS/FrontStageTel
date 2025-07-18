import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationMessage, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div 
        class="notification"
        [class.success-notification]="notification.type === 'success'"
        [class.error-notification]="notification.type === 'error'"
        *ngIf="notification"
      >
        <div class="notification-icon">
          {{ notification.type === 'success' ? '✓' : '✕' }}
        </div>
        <div class="notification-content">
          <h3>{{ notification.type === 'success' ? 'Succès' : 'Erreur' }}</h3>
          <p>{{ notification.message }}</p>
          <button 
            type="button" 
            class="close-btn" 
            (click)="closeNotification()"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    }

    .notification {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      border-radius: 15px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.5s ease-out;
      color: white;
    }

    .success-notification {
      background: linear-gradient(135deg, #00c851 0%, #00a040 100%);
    }

    .error-notification {
      background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .notification-icon {
      font-size: 2.5rem;
      margin-right: 1rem;
      animation: bounce 1s ease-in-out;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    .notification-content {
      flex: 1;
    }

    .notification-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .notification-content p {
      margin: 0 0 1rem 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: 0.6rem 1.5rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notification-container {
        top: 10px;
        right: 10px;
        left: 10px;
      }
      
      .notification {
        min-width: auto;
        max-width: none;
        padding: 1rem;
        flex-direction: column;
        text-align: center;
      }
      
      .notification-icon {
        font-size: 2rem;
        margin-right: 0;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notification: NotificationMessage | null = null;
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notification$.subscribe(
      (notification: NotificationMessage | null) => {
        this.notification = notification;
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  closeNotification() {
    this.notificationService.hideNotification();
  }
}
