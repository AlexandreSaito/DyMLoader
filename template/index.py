import json

def get_plugin(plugin):

    def when_get_data(page, data):
        plugin.send(f"data received: {json.dumps(data)}")
        page.load_html('#list-data-getted', 
                       [ { 'tag': 'div', 'text': f"data received: {json.dumps(data)}" } ], 
                       { 
                           'clear_before_render': True #can be omitted, default: True
                       })
        
    @plugin.event
    def init():
        plugin.send('{module_name} init')
       
    @plugin.event
    def on_page_load(page):
        plugin.send('{module_name} on_page_load') 
        
        @page.event_listener('click', '#btn-1')
        def print_when_click():
            plugin.send(f"'#btn-1' was clicked")
            page.get_data([ '#text-1', '#select-1', 'input[name="rdb-1"]', '#chk-1' ], when_get_data)
        
        @page.event_listener('change', '#select-1')
        def print_when_click(data):
            plugin.send(f"'#select-1' value has changed to {data}")
            
        @page.event_listener('change', 'input[name="rdb-1"]')
        def print_when_rdb_change(data):
            plugin.send(f"radio value has changed to {data}")
            
        @page.event_listener('change', '#chk-1')
        def print_when_chk_change(data):
            plugin.send(f"check value has changed to {data}")
            
        page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': 'Content Load from script!' } ], {  })
            
    @plugin.event
    def before_page_load():
        plugin.send('{module_name} before_page_load') 
        
    @plugin.event
    def before_page_close(page):
        plugin.send('{module_name} before_page_close') 
        
    @plugin.event
    def before_quit():
        plugin.send('{module_name} before_quit') 
       