# MoManI
Model Management Infrastructure

When deploying, change line 6 in the index.html file in the UI project so that the momani-settings-api points to where you deployed your api.

Install GLPK:
Download GLPK (https://sourceforge.net/projects/winglpk/)
Add path to path variable "C:\glpk-4.57\w64" or similar, depending on where GLPK was extracted, 
this folder should contain the file "glpsol.exe"



Notes on deployment with intent to develop:

Install IIS. In "Turn Windows Features on or off" enable:
Internet Information Services
	Web Management Tools
		IIS Management Console
	World Wide Web services
		Application Development Features
			ASP.NET 4.6
		Common HTTP Features	
			Default Document
			Static Content

Install MongoDB and configure it as a service:
https://docs.mongodb.org/v3.0/tutorial/install-mongodb-on-windows/#configure-a-windows-service-for-mongodb

Advise: disable caching on you web dev tools for easier troubleshooting.

