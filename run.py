import os
from api.app import app

def run():
	port = int(os.environ.get('PORT', 5000))
	app.debug = True
	app.root_path = os.path.abspath(os.path.dirname(__file__))
	app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
	run()