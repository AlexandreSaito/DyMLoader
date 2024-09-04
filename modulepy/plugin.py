from modulepy.basics import send_to_nodejs, log
import json

class Plugin:
    def __init__(self):
        self._commands = {}
        self._page = None
    
    def set_page(self, page):
        self._page = page

    def get_page(self):
        return self._page

    def send(self, data):
        send_to_nodejs(data)
        
    def log(self, data):
        if type(data) is str:
            send_to_nodejs(data)
            return
        send_to_nodejs(json.dumps(data))

    def event(self, func):
        event_name = func.__name__
        if event_name not in self._commands:
            self._commands[event_name] = []
        self._commands[event_name].append(func)
        return func

    def init(self, func):
        if 'init' not in self._commands:
            self._commands['init'] = []
        self._commands['init'].append(func)
        return func
        
    def before_page_load(self, func):
        if 'before_page_load' not in self._commands:
            self._commands['before_page_load'] = []
        self._commands['before_page_load'].append(func)
        return func

    def on_page_load(self, func):
        if 'on_page_load' not in self._commands:
            self._commands['on_page_load'] = []
        self._commands['on_page_load'].append(func)
        send_to_nodejs(f"Registering on_page_load")
        return func

    def before_page_close(self, func):
        if 'before_page_close' not in self._commands:
            self._commands['before_page_close'] = []
        self._commands['before_page_close'].append(func)
        return func

    def on_page_close(self, func):
        if 'on_page_close' not in self._commands:
            self._commands['on_page_close'] = []
        self._commands['on_page_close'].append(func)
        return func

    def before_quit(self, func):
        if 'before_quit' not in self._commands:
            self._commands['before_quit'] = []
        self._commands['before_quit'].append(func)
        return func
