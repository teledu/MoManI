using System;
using System.Configuration;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using System.Web.Cors;
using System.Web.Http;
using Microsoft.Owin;
using Microsoft.Owin.Cors;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.DataHandler.Encoder;
using Microsoft.Owin.Security.Jwt;
using Microsoft.Owin.Security.OAuth;
using Owin;

[assembly: OwinStartup(typeof(MoManI.Api.Startup))]

namespace MoManI.Api
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            //var issuer = ConfigurationManager.AppSettings["jwtIssuer"];
            //var audience = ConfigurationManager.AppSettings["jwtClientId"];
            //var jwtKey = TextEncodings.Base64.Decode(ConfigurationManager.AppSettings["jwtVerificationKey"]);
            //var authOptions = new JwtBearerAuthenticationOptions
            //{
            //    AuthenticationMode = AuthenticationMode.Active,
            //    AllowedAudiences = new[] { audience },
            //    IssuerSecurityTokenProviders = new IIssuerSecurityTokenProvider[]
            //    {
            //        new X509CertificateSecurityTokenProvider(issuer, new X509Certificate2(jwtKey)), 
            //    }
            //};
            //app.UseJwtBearerAuthentication(authOptions);

            var config = new HttpConfiguration();
            Bootstrapper.InstallDatabase();
            Bootstrapper.StartWith(config);

            var allowedOrigin = ConfigurationManager.AppSettings["allowOrigin"];
            if (allowedOrigin != "*")
            {
                var policy = new CorsPolicy
                {
                    AllowAnyHeader = true,
                    AllowAnyMethod = true,
                    SupportsCredentials = true,
                };

                if (allowedOrigin.EndsWith("/")) allowedOrigin = allowedOrigin.Substring(0, allowedOrigin.Length - 1);

                policy.Origins.Add(allowedOrigin);
                app.UseCors(new CorsOptions
                {
                    PolicyProvider = new CorsPolicyProvider
                    {
                        PolicyResolver = context => Task.FromResult(policy)
                    },
                    CorsEngine = new SubdomainsAcceptingCorsEngine()
                });
            }
            else
            {
                app.UseCors(CorsOptions.AllowAll);
            }
            app.UseWebApi(config);
        }

        public class SubdomainsAcceptingCorsEngine : CorsEngine
        {
            public override bool TryValidateOrigin(CorsRequestContext requestContext, CorsPolicy policy, CorsResult result)
            {
                if (requestContext == null)
                {
                    throw new ArgumentNullException(nameof(requestContext));
                }
                if (policy == null)
                {
                    throw new ArgumentNullException(nameof(policy));
                }
                if (result == null)
                {
                    throw new ArgumentNullException(nameof(result));
                }

                if (requestContext.Origin != null)
                {
                    if (policy.AllowAnyOrigin)
                    {
                        if (policy.SupportsCredentials)
                        {
                            result.AllowedOrigin = requestContext.Origin;
                        }
                        else
                        {
                            result.AllowedOrigin = CorsConstants.AnyOrigin;
                        }
                    }
                    else if (policy.Origins.Any(x => UrlExtensions.IsSubdomainOf(requestContext.Origin, x)))
                    {
                        result.AllowedOrigin = requestContext.Origin;
                    }
                    else
                    {
                        result.ErrorMessages.Add($"Origin {requestContext.Origin} not allowed");
                    }
                }
                else
                {
                    result.ErrorMessages.Add("No origin header present");
                }

                return result.IsValid;
            }
        }

        public static class UrlExtensions
        {
            public static bool IsSubdomainOf(string subdomainUrl, string domainUrl)
            {
                if (!subdomainUrl.StartsWith("http")) subdomainUrl = "http://" + subdomainUrl;
                if (!domainUrl.StartsWith("http")) domainUrl = "http://" + domainUrl;
                if (!Uri.IsWellFormedUriString(subdomainUrl, UriKind.Absolute)) return false;
                if (!Uri.IsWellFormedUriString(domainUrl, UriKind.Absolute)) return false;

                var subdomainUri = new Uri(subdomainUrl);
                var domainUri = new Uri(domainUrl);

                var subdomainHost = subdomainUri.Host;
                var domainHost = domainUri.Host;

                return subdomainHost.IndexOf(domainHost, StringComparison.OrdinalIgnoreCase) > -1 && subdomainHost.EndsWith(domainHost);
            }
        }
    }
}
