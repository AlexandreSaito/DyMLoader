import sys, json, inspect

def stdout_message(message):
    sys.stdout.write(message)
    sys.stdout.write('\r\n')
    sys.stdout.flush()

def send_to_nodejs(data):
    if type(data) is str:
        stdout_message(data)
        return
    try:
        stdout_message(json.dumps(data))
    except Exception as e:
        stdout_message(f"Exception: {str(e)}")

def log(data):
    try:
        message = data if type(data) is not str else json.dumps(data)
        current_frame = inspect.currentframe()

        caller_frame = inspect.getouterframes(current_frame, 2)[1]
        calling_function_name = caller_frame.function
        calling_file = caller_frame.filename
        calling_line_number = caller_frame.lineno

        stdout_message(f"on {calling_file}; function {calling_function_name} line {calling_line_number}; {message}")
    except Exception as e:
        stdout_message(f"Exception: {str(e)}")

def get_data(request):
    if 'data' in request:
        return request["data"]
    return {}