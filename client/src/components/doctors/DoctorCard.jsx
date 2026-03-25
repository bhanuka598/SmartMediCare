import React from 'react';
import { Star, Clock, Video } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card, CardContent, CardFooter } from '../shared/Card';
import { Badge } from '../shared/Badge';

export function DoctorCard({ doctor, onBook }) {
  return (
    <Card className="overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
      <CardContent className="p-0 flex-1">
        
        <div className="p-5 flex gap-4">
          
          <div className="relative h-20 w-20 shrink-0">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-full w-full rounded-full object-cover border border-slate-200"
            />

            {doctor.isOnline && (
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500"></span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 truncate">
              {doctor.name}
            </h3>

            <p className="text-sm text-blue-600 font-medium mb-1">
              {doctor.specialty}
            </p>

            <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-900">
                {doctor.rating}
              </span>
              <span>({doctor.reviews} reviews)</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="text-xs font-normal">
                {doctor.experience} yrs exp.
              </Badge>

              <Badge
                variant="info"
                className="text-xs font-normal flex items-center gap-1"
              >
                <Video className="h-3 w-3" /> Telemedicine
              </Badge>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
          
          <div>
            <p className="text-slate-500 mb-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Next Available
            </p>
            <p className="font-medium text-slate-900">
              {doctor.nextAvailable}
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-0.5">
              Consultation Fee
            </p>
            <p className="font-medium text-slate-900">
              Rs. {doctor.fee}
            </p>
          </div>

        </div>
      </CardContent>

      <CardFooter className="p-4 border-t border-slate-100">
        <Button fullWidth onClick={() => onBook(doctor.id)}>
          Book Appointment
        </Button>
      </CardFooter>
    </Card>
  );
}