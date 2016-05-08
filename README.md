# MoManI
Model Management Infrastructure


When using MoManI to run simulations:

Install GLPK:
Download GLPK (for example from here: https://sourceforge.net/projects/winglpk/)
Add path to path variable "C:\glpk-4.57\w64" or similar, depending on where GLPK was extracted, 
this folder should contain the file "glpsol.exe"


When deploying:

Change line 6 in the index.html file in the UI project so that the momani-settings-api points to where you deployed your api.

Install MongoDB and configure it as a service:
https://docs.mongodb.org/v3.0/tutorial/install-mongodb-on-windows/#configure-a-windows-service-for-mongodb


For development:

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