from django.core.management.base import BaseCommand
from django.conf import settings
import os
import subprocess
import sys


class Command(BaseCommand):
    help = 'Start both Django HTTP and Daphne WebSocket servers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--localhost',
            action='store_true',
            help='Start servers on localhost only (127.0.0.1)',
        )

    def handle(self, *args, **options):
        # Get configuration from settings
        django_port = settings.DJANGO_PORT
        daphne_port = settings.DAPHNE_PORT
        host = '127.0.0.1' if options['localhost'] else settings.HOST
        
        self.stdout.write(
            self.style.SUCCESS('🚀 Starting Online Debate Platform servers...')
        )
        self.stdout.write('=' * 60)
        
        if options['localhost']:
            self.stdout.write(
                self.style.WARNING('📍 Localhost mode - accessible only from this computer')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'🔧 Django API: http://127.0.0.1:{django_port}')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'🔌 WebSocket: ws://127.0.0.1:{daphne_port}')
            )
        else:
            local_ip = settings.LOCAL_IP
            self.stdout.write(
                self.style.WARNING('🌐 Network mode - accessible from other devices')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'🔧 Django API: http://{local_ip}:{django_port}')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'🔌 WebSocket: ws://{local_ip}:{daphne_port}')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'📊 Admin Panel: http://{local_ip}:{django_port}/admin')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'📖 API Docs: http://{local_ip}:{django_port}/swagger')
            )
        
        self.stdout.write('=' * 60)
        self.stdout.write(
            self.style.WARNING('💡 Note: This command starts both servers, but they run independently.')
        )
        self.stdout.write(
            self.style.WARNING('💡 For better control, use separate terminals with:')
        )
        self.stdout.write(
            self.style.HTTP_INFO(f'   Terminal 1: python manage.py startapi')
        )
        self.stdout.write(
            self.style.HTTP_INFO(f'   Terminal 2: python manage.py startws')
        )
        self.stdout.write('')
        
        # Ask user which server to start
        self.stdout.write('Which server would you like to start?')
        self.stdout.write('1. Django HTTP server only')
        self.stdout.write('2. Daphne WebSocket server only')
        self.stdout.write('3. Exit (use separate commands)')
        
        try:
            choice = input('Enter your choice (1-3): ').strip()
            
            if choice == '1':
                self.stdout.write(self.style.SUCCESS('Starting Django HTTP server...'))
                cmd = [sys.executable, 'manage.py', 'runserver', f'{host}:{django_port}']
                subprocess.run(cmd)
            elif choice == '2':
                self.stdout.write(self.style.SUCCESS('Starting Daphne WebSocket server...'))
                cmd = ['daphne', '-b', host, '-p', str(daphne_port), 'onlineDebatePlatform.asgi:application']
                subprocess.run(cmd)
            else:
                self.stdout.write(self.style.WARNING('Exiting. Use separate commands for better control.'))
                return
                
        except KeyboardInterrupt:
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('✅ Server stopped.'))
        except FileNotFoundError as e:
            if 'daphne' in str(e):
                self.stdout.write(self.style.ERROR('❌ Daphne not found. Install with: pip install daphne'))
            else:
                self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
