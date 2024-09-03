import importlib.util, sys, os, json, inspect
from modulepy.basics import stdout_message, send_to_nodejs, log, get_data
from modulepy.plugin import Plugin
from modulepy.page import Page

# debug
import builtins

def handle_request(request):
    if 'module' not in request:
        log('request without module name!')
        #log(request)
        return

    module = request['module']

    if 'action' not in request:
        log(f'[{module}]request without action name!')
        #log(request)
        return

    action = request['action']
    method = getattr(actions, action)

    if method is None:
        log(f'[{module}] method not found!')
        #log(request)
        return
        
    #log(f"action: {action} for: {module}")
    data = get_data(request)
    method(module, data)

class Actions:
    def check_plugin(self, module_name):
        return module_name in plugins;

    def setup(self, module_name, data):
        #log(f"action: setup for: {module_name}")
        if self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] setup was called when it's already created")
            return

        spec = importlib.util.spec_from_file_location(module_name, data['mainFilePath'])
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if module.get_plugin is None:
            log(f"[ModuleManager.py {module_name}] get_plugin is not defined")
            self.unload(module)
            return

        plugins[module_name] = { 'spec': spec, 'module': module, 'plugin': Plugin() }
        module.get_plugin(plugins[module_name]['plugin'])

    def init(self, module_name, data):
        #log(f"action: init for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on init module not found")
            return

        for func in plugins[module_name]['plugin']._commands['init']:
            func()

        send_to_nodejs({ 'module': module_name, 'data': { 'action': 'response', 'requested': 'init', 'status': 'ok' } })
        
    def before_page_load(self, module_name, data):
        #log(f"action: on_page_load for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on before_page_load module not found")
            return

        for func in plugins[module_name]['plugin']._commands['before_page_load']:
            func()

        send_to_nodejs({ 'module': module_name, 'data': { 'action': 'response', 'requested': 'before_page_load', 'status': 'ok' } })

    def on_page_load(self, module_name, data):
        log(f"action: on_page_load for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on on_page_load module not found")
            return
            
        log(f"[ModuleManager.py {module_name}] on_page_load")

        plugin = plugins[module_name]['plugin']

        plugin.set_page(Page(module_name))
        for func in plugin._commands['on_page_load']:
            func(plugin.get_page())

        send_to_nodejs({ 'module': module_name, 'data': { 'action': 'response', 'requested': 'on_page_load', 'status': 'ok' } })
        
    def before_page_close(self, module_name, data):
        #log(f"action: on_page_load for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on on_page_load module not found")
            return
        
        plugin = plugins[module_name]['plugin']
        for func in plugin._commands['on_page_load']:
            func(plugin.get_page())

        plugin.set_page(None)
        send_to_nodejs({ 'module': module_name, 'data': { 'action': 'response', 'requested': 'on_page_load', 'status': 'ok' } })

    def unload(self, module_name, data):
        #log(f"action: unload for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on unload module not found")
            return

        for func in plugins[module_name]['plugin']._commands['before_quit']:
            func()

        #log('modules')
        # Get a set of built-in module names
        #builtin_modules = set(sys.builtin_module_names)
        # Get all non-built-in module names currently in sys.modules
        #non_builtin_modules = [name for name in sys.modules.keys() if name not in builtin_modules and not name.startswith('json') and not name.startswith('async') and not name.startswith('typing') and not name.startswith('json')]

        #for name in non_builtin_modules: 
        #    log(name)
        #del sys.modules[module_name]
        del plugins[module_name]['module']
        del plugins[module_name]['plugin']
        del plugins[module_name]
        send_to_nodejs({ 'module': module_name, 'data': { 'action': 'response', 'requested': 'unload', 'status': 'ok' } })
        
    def page_data(self, module_name, data):
        #log(f"action: unload for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on page_data module not found")
            return

        if plugins[module_name]['plugin'].get_page() is None:
            log(f"[ModuleManager.py {module_name}] on page not loaded")
            return
            
        if data is None:
            log(f"[ModuleManager.py {module_name}] data is null")
            return

        plugins[module_name]['plugin'].get_page().receive_data(data['request_id'], data['data'])

    def page_event(self, module_name, data):
        #log(f"action: unload for: {module_name}")
        if not self.check_plugin(module_name):
            log(f"[ModuleManager.py {module_name}] on page_event module not found")
            return

        if plugins[module_name]['plugin'].get_page() is None:
            log(f"[ModuleManager.py {module_name}] on page not loaded")
            return
            
        if data is None:
            log(f"[ModuleManager.py {module_name}] data is null")
            return

        if 'data' in data:
            plugins[module_name]['plugin'].get_page().execute_event(data['event_name'], data['query_selector'], data['data'])
        else:
            plugins[module_name]['plugin'].get_page().execute_event(data['event_name'], data['query_selector'], None)

plugins = {}

actions = Actions()

# Get the module directory
plugin_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'module'))
# Add the module directory to sys.path
sys.path.insert(0, plugin_dir)

send_to_nodejs(plugin_dir)

should_stop = False

while should_stop == False:
    line = sys.stdin.readline()
    if not line:
        continue
    input_data = line.strip()
    if input_data == "":
        continue
    #log(input_data)
    request = {}
    try:
        request = json.loads(input_data)
    except Exception as e:
        log(f"on json.loads {str(e)}, input: {input_data}")
    handle_request(request)
    #try:
    #except Exception as e:
    #    log(f"on handle_request {str(e)}, input: {input_data}")