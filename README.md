# MoManI
Model Management Infrastructure

When deploying, change line 6 in the index.html file in the UI project so that the momani-settings-api points to where you deployed your api.

Notes on deployment with intent to develop:

Install IIS. In "Turn Windows Features on or off" enable:
Internet Information Services
	Web Management Tools
		IIS Management Console
	World Wide Web services
		Application Development Features
			.NET Extensibility 4.6
			ASP.NET 4.6
			ISAPI Extensions
			ISAPI Filters
			WebSocket Protocol
		Common HTTP Features	
			Default Document
			Static Content
		Security
			Request Filtering

Install MongoDB and configure it as a service:
https://docs.mongodb.org/v3.0/tutorial/install-mongodb-on-windows/#configure-a-windows-service-for-mongodb

Install GLPK (https://www.gnu.org/software/glpk/)
Add path to path variable "C:\glpk-4.57\w64" or similar, depending on where GLPK was installed, 
this folder should contain the file "glpsol.exe"

Advisable: disable caching on you web dev tools for easier troubleshooting.

