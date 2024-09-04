import inspect
from modulepy.basics import send_to_nodejs, log

class ModalActions:
    def __init__(self, module_name, request_id):
        self._module_name = module_name
        self._request_id = request_id

    def response(self, data):
        send_to_nodejs({ "module": self._module_name, 'data': { 'action': 'page_modal_event', 'function': 'response', 'requestId': self._request_id, 'data': data } })
        
class Page:
    def __init__(self, module_name):
        self._events = {}
        self._request = {}
        self._request_id = 1
        self._module_name = module_name
    
    def event_listener(self, event_name, query):
        def decorator(func):
            #log(f"{event_name} / {query}")
            if event_name not in self._events:
                self._events[event_name] = {}

            self._events[event_name][query] = func
            send_to_nodejs({ "module": self._module_name, 'data': { 'action': 'page_add_event_listener', 'event': event_name, 'query_selector': query } })
            return func
        return decorator

    def load_html(self, parent_query, html_or_file, options):
        send_to_nodejs({ "module": self._module_name, 'data': { 'action': 'page_load_html', 'parent_query': parent_query, 'html_or_file': html_or_file, 'options': options } })
    
    def execute_event(self, event_name, query, data):
        if self._events[event_name] is None:
            log(f"{event_name} not found!")
        if self._events[event_name][query] is None:
            log(f"{event_name}; {query} not found!")

        signature = inspect.signature(self._events[event_name][query])
        if len(signature.parameters) == 1:
            self._events[event_name][query](data)
        else:
            self._events[event_name][query]()
        pass

    def receive_data(self, request_id, data):
        if self._request[request_id] is None:
            log(f"Request ({request_id}) not found!")
            return
        self._request[request_id](self, data)

    def get_data(self, query_elements, on_receive):
        self._request_id += 1
        request_id = self._request_id
        self._request[request_id] = on_receive;
        send_to_nodejs({ "module": self._module_name, 'data': { 'action': 'page_get_data', 'requestId': request_id, 'params': query_elements } })
        
    def receive_modal_interaction(self, request_id, origin, data):
        if self._request[request_id] is None:
            log(f"Request ({request_id}) not found!")
            return
        self._request[request_id](self, ModalActions(self._module_name, request_id), origin, data)

    def modal(self, modalOptions):
        if 'title' not in modalOptions:
            log('Title not defined on modal!')
            return False
        if 'body' not in modalOptions:
            return False
        if 'footer' not in modalOptions:
            return False
        if 'on' not in modalOptions:
            return False
        
        request_id = self._request_id
        self._request[request_id] = modalOptions['on']
        send_to_nodejs({ 
            "module": self._module_name, 'data': { 
                'action': 'page_modal', 'requestId': request_id, 
                'title': modalOptions['title'], 'body': modalOptions['body'], 'footer': modalOptions['footer']
                } 
            })