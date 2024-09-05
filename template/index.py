import json

# This file is imported by DyMLoader

# Check it later
html_load_options = {
    'clear_before_render': True #can be omitted, default: True  
}

# This is a require funcion to run properly
def get_plugin(plugin): 
    plugin.log('{module_name} is initializing')

    # @plugin.event is a notation to run at specific timing and the name of definition is important, as they describe the timing that it will run

    # Execute when user click to open a page
    @plugin.event
    def before_page_load(): 
        plugin.log('{module_name} before_page_load') 
       
    # Execute when the render process end (page is done loading)
    @plugin.event
    def on_page_load(page): # This method should receive a page class witch will bridge the front-end (page) to back-end (this script)
        plugin.log('{module_name} on_page_load') 
        
        # To render a HTML call page.load_html passing query string to element and a HTML string or JSON (Check HTMLObject in [helper] -> HTMLObject)
        page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': 'Content Load from script!' } ], {  })

        # @page.event_listener register a event for a especific HTML element, differently of @plugin.event they don't need to have a specific name

        # Adding event on button with id 'btn-1' witch is 'Get Data!' button on page.html
        @page.event_listener('click', '#btn-1')
        def print_when_click():
            plugin.log(f"'#btn-1' was clicked")
            # After the button is clicked it will request data from inputs, passing a callback 'when_receive_data'
            page.get_data([ '#text-1', '#select-1', 'input[name="rdb-1"]', '#chk-1', '#inputFile' ], when_receive_data)
        
        # Adding event on button with id 'btn-2' witch is 'Open Modal!' button on page.html
        @page.event_listener('click', '#btn-2')
        def btn_open_modal():
            plugin.log(f"'#btn-2' was clicked")
            # After the button is clicked it will open a modal with some text and a close button, passing a callback 'when_modal_event_happend'
            page.modal({
                'title': 'Title',
                'body': 'A text on the body.',
                'footer': [ 
					{ 'role': 'modal-dismiss' }
				],
                'on': when_modal_event_happend,
            })

        # Adding event on button with id 'btn-3' witch is 'Open Modal With Form!' button on page.html
        @page.event_listener('click', '#btn-3')
        def btn_open_modal_with_form():
            plugin.log(f"'#btn-3' was clicked")
            # After the button is clicked it will open a modal with a input and save/close button, passing a callback 'when_modal_event_happend'
            page.modal({
                'title': 'Title',
                'body': [ { 'tag': 'input', 'name': 'modal-input', 'class': 'form-control' } ],
                'footer': [ 
					{ 'role': 'modal-dismiss' },
					{ 'tag': 'button', 'type': 'button', 'id': 'btn-save', 'class': 'btn btn-success', 'text': 'Save' },
				],
                'on': when_modal_event_happend,
            })

        # Adding event on button with id 'btn-3' witch is 'Open Modal With Form!' button on page.html
        @page.event_listener('change', '#select-1')
        def print_when_click(data):
            plugin.log(f"'#select-1' value has changed to {data}")
            # After the select has their value changed load a html
            page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': f"'#select-1' value has changed to {data}" } ], html_load_options )
            
        @page.event_listener('change', 'input[name="rdb-1"]')
        def print_when_rdb_change(data):
            plugin.log(f"radio value has changed to {data}")
            # After the radio has their value changed load a html
            page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': f"radio value has changed to {data}" } ], html_load_options )
            
        @page.event_listener('change', '#chk-1')
        def print_when_chk_change(data):
            plugin.log(f"check value has changed to {data}")
            # After the checkbox has their value changed load a html
            page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': f"check value has changed to {data}" } ], html_load_options )
            
    # Execute when the user close the app window or change paged
    @plugin.event
    def before_page_close(page): 
        plugin.log('{module_name} before_page_close') 
        
    # Execute when the user terminate the app 
    @plugin.event
    def before_quit(): 
        plugin.log('{module_name} before_quit') 
       

    # function called on page listener
    def when_receive_data(page, data):
        plugin.log(f"data received: {json.dumps(data)}")
        page.load_html('#list-data-getted', [ { 'tag': 'div', 'text': f"data received: {json.dumps(data)}" } ], html_load_options)
        
    # function called on page listener
    def when_modal_event_happend(page, event, origin, data):
        plugin.log(f"origin received: {json.dumps(origin)}")
        plugin.log(f"data received: {json.dumps(data)}")
        # When a footer button on modal is pressed they are passed as 'origin'
        # 'event-close' is a default for { 'role': 'modal-dismiss' }
        if origin == 'event-close':
            return
        # If is a modal with 'modal-input' element just to differentiate from modal without input
        if 'modal-input' in data:
            if data['modal-input'] is None or data['modal-input'] == '':
                # When response with string it will show as a alert
                event.response('Fill the input!')
                return
        # To send a positive response and close the modal
        event.response(True)