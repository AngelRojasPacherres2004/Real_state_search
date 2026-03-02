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
  X
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyComparatorProps {
  properties: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveProperty: (propertyId: number) => void;
}

export default function PropertyComparator({ 
  properties, 
  open, 
  onOpenChange,
  onRemoveProperty 
}: PropertyComparatorProps) {
  if (properties.length === 0) return null;

  const handleWhatsAppClick = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Comparar Propiedades ({properties.length}/4)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4 relative">
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => onRemoveProperty(property.id)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Image */}
                {property.imageUrl && (
                  <div className="relative h-40 bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {property.portal}
                    </Badge>
                  </div>
                )}

                {/* Title */}
                <h3 className="font-semibold text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                  {property.title}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3 bg-primary/10 p-2 rounded">
                  <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Precio</p>
                    <p className="font-bold text-sm truncate">
                      {property.currency} {parseFloat(property.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-2 mb-3">
                  {property.bedrooms && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{property.bedrooms} dormitorios</span>
                    </div>
                  )}

                  {property.bathrooms && (
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{property.bathrooms} baños</span>
                    </div>
                  )}

                  {property.area && (
                    <div className="flex items-center gap-2">
                      <Maximize className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{parseFloat(property.area).toFixed(0)} m²</span>
                    </div>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {property.address || property.district}
                  </p>
                </div>

                {/* Contact */}
                {(property.ownerPhone || property.ownerEmail || property.ownerWhatsapp) && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold mb-2">Contacto:</p>
                      
                      {property.ownerWhatsapp && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-xs"
                          onClick={() => handleWhatsAppClick(property.ownerWhatsapp)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                      )}

                      {property.ownerPhone && !property.ownerWhatsapp && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.location.href = `tel:${property.ownerPhone}`}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Llamar
                        </Button>
                      )}

                      {property.ownerEmail && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.location.href = `mailto:${property.ownerEmail}`}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* View Original */}
                <Separator className="my-3" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  asChild
                >
                  <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver Original
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
