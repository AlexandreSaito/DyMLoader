import json

def get_plugin(plugin):

    def when_get_data(page, data):
        plugin.log(f"data received: {json.dumps(data)}")
        page.load_html('#list-data-getted', 
                       [ { 'tag': 'div', 'text': f"data received: {json.dumps(data)}" } ], 
                       { 
                           'clear_before_render': True #can be omitted, default: True
                       })
        
    def when_modal_event_happend(page, event, origin, data):
        plugin.log(f"origin received: {json.dumps(origin)}")
        plugin.log(f"data received: {json.dumps(data)}")
        if 'modal-input' in data:
            if data['modal-input'] is None:
                event.response('Fill the input!')
                return
        event.response(True)

    @plugin.event
    def init():
        plugin.log('{module_name} init')
       
    @plugin.event
    def on_page_load(page):
        plugin.log('{module_name} on_page_load') 
        
        @page.event_listener('click', '#btn-1')
        def print_when_click():
            plugin.log(f"'#btn-1' was clicked")
            page.get_data([ '#text-1', '#select-1', 'input[name="rdb-1"]', '#chk-1', '#inputFile' ], when_get_data)
        
        @page.event_listener('click', '#btn-2')
        def btn_open_modal():
            plugin.log(f"'#btn-2' was clicked")
            page.modal({
                'title': 'Title',
                'body': 'A text on the body.',
                'footer': [ 
					{ 'role': 'modal-dismiss' },
					{ 'tag': 'button', 'type': 'button', 'id': 'btn-save', 'class': 'btn btn-success', 'text': 'Save' },
				],
                'on': when_modal_event_happend,
            })

        @page.event_listener('click', '#btn-3')
        def btn_open_modal_with_form():
            plugin.log(f"'#btn-3' was clicked")
            page.modal({
                'title': 'Title',
                'body': [ { 'tag': 'input', 'name': 'modal-input', 'class': 'form-control' } ],
                'footer': [ 
					{ 'role': 'modal-dismiss' },
					{ 'tag': 'button', 'type': 'button', 'id': 'btn-save', 'class': 'btn btn-success', 'text': 'Save' },
				],
                'on': when_modal_event_happend,
            })

        @page.event_listener('change', '#select-1')
        def print_when_click(data):
            plugin.log(f"'#select-1' value has changed to {data}")
            
        @page.event_listener('change', 'input[name="rdb-1"]')
        def print_when_rdb_change(data):
            plugin.log(f"radio value has changed to {data}")
            
        @page.event_listener('change', '#chk-1')
        def print_when_chk_change(data):
            plugin.log(f"check value has changed to {data}")
            
        page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': 'Content Load from script!' } ], {  })
            
    @plugin.event
    def before_page_load():
        plugin.log('{module_name} before_page_load') 
        
    @plugin.event
    def before_page_close(page):
        plugin.log('{module_name} before_page_close') 
        
    @plugin.event
    def before_quit():
        plugin.log('{module_name} before_quit') 
       