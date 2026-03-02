import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  DollarSign, 
  Phone, 
  Mail, 
  MessageCircle,
  ExternalLink,
  Building2,
  User,
  Briefcase
} from "lucide-react";

interface PropertyDetailModalProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PropertyDetailModal({ property, open, onOpenChange }: PropertyDetailModalProps) {
  if (!property) return null;

  const handleWhatsAppClick = (phone: string) => {
    // Remove non-numeric characters and format for WhatsApp
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{property.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {property.imageUrl && (
            <div className="relative h-64 md:h-96 bg-muted rounded-lg overflow-hidden">
              <img
                src={property.imageUrl}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 left-4" variant="secondary">
                {property.portal}
              </Badge>
            </div>
          )}

          {/* Price and Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {property.currency === 'PEN' ? 'S/' : '$'}
                  </Badge>
                  <p className="font-bold text-lg">
                    {parseFloat(property.price).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {property.bedrooms && (
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Dormitorios</p>
                  <p className="font-bold">{property.bedrooms}</p>
                </div>
              </div>
            )}

            {property.bathrooms && (
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Baños</p>
                  <p className="font-bold">{property.bathrooms}</p>
                </div>
              </div>
            )}

            {property.area && (
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Área</p>
                  <p className="font-bold">{parseFloat(property.area).toFixed(0)} m²</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Location */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación
            </h3>
            <p className="text-muted-foreground">
              {property.address || property.district}
              {property.province && `, ${property.province}`}
            </p>
          </div>

          {/* Full Description */}
          {(property.fullDescription || property.description) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {property.fullDescription || property.description}
                </p>
              </div>
            </>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities !== '-' && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Amenidades</h3>
                <p className="text-muted-foreground">{property.amenities}</p>
              </div>
            </>
          )}

          {/* Building Amenities */}
          {property.buildingAmenities && property.buildingAmenities !== '-' && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Amenidades del Edificio
                </h3>
                <p className="text-muted-foreground">{property.buildingAmenities}</p>
              </div>
            </>
          )}

          {/* Nearby Places */}
          {property.nearbyPlaces && property.nearbyPlaces !== '-' && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Lugares Cercanos</h3>
                <p className="text-muted-foreground">{property.nearbyPlaces}</p>
              </div>
            </>
          )}

          {/* Contact Information */}
          {(property.ownerName || property.ownerPhone || property.ownerEmail || property.agentName) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-4">Información de Contacto</h3>
                
                <div className="space-y-4">
                  {/* Owner Info */}
                  {(property.ownerName || property.ownerPhone || property.ownerEmail) && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">
                          {property.ownerName || 'Propietario'}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {property.ownerPhone && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCallClick(property.ownerPhone)}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Llamar
                            </Button>
                            
                            {property.ownerWhatsapp && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleWhatsAppClick(property.ownerWhatsapp)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                              </Button>
                            )}
                          </>
                        )}
                        
                        {property.ownerEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEmailClick(property.ownerEmail)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        )}
                      </div>
                      
                      {property.ownerPhone && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Tel: {property.ownerPhone}
                        </p>
                      )}
                      {property.ownerEmail && (
                        <p className="text-sm text-muted-foreground">
                          Email: {property.ownerEmail}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Agent Info */}
                  {property.agentName && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Agente Inmobiliario</h4>
                      </div>
                      <p className="text-muted-foreground">{property.agentName}</p>
                      {property.agentCompany && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {property.agentCompany}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Original Listing Link */}
          <Separator />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Publicado en: <span className="font-semibold">{property.portal}</span>
            </p>
            <Button variant="outline" asChild>
              <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Anuncio Original
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
