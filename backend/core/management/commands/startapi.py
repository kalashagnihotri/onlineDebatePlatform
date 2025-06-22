from django.core.management.base import BaseCommand
from django.core.management import execute_from_command_line
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Start Django HTTP server with network access'

    def add_arguments(self, parser):
        parser.add_argument(
            '--localhost',
            action='store_true',
            help='Start server on localhost only (127.0.0.1)',
        )

    def handle(self, *args, **options):
        # Get configuration from settings
        port = settings.DJANGO_PORT
        host = '127.0.0.1' if options['localhost'] else settings.HOST
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Starting Django HTTP server...')
        )
        self.stdout.write(
            self.style.WARNING(f'📍 Server will be available at: http://{host}:{port}')
        )
        
        if not options['localhost']:
            local_ip = settings.LOCAL_IP
            self.stdout.write(
                self.style.HTTP_INFO(f'🌐 Network URL: http://{local_ip}:{port}')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'📊 Admin Panel: http://{local_ip}:{port}/admin')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'📖 API Docs: http://{local_ip}:{port}/swagger')
            )
        
        # Start the server
        server_address = f'{host}:{port}'
        execute_from_command_line(['manage.py', 'runserver', server_address])
