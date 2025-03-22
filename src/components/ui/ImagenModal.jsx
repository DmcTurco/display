import React from 'react';
import { X } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from './alert-dialog';


const ImageModal = ({ imageUrl, itemName, open, onOpenChange }) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-full max-w-xl">
                <AlertDialogHeader>
                    <div className="flex justify-between items-center">
                        <AlertDialogTitle>Imagen de {itemName}</AlertDialogTitle>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-1 rounded-full hover:bg-gray-200"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </AlertDialogHeader>
                <div className="flex justify-center mt-4">
                    <img
                        src={imageUrl}
                        alt={`Imagen para ${itemName}`}
                        className="max-w-full h-auto rounded-md shadow-md"
                    />
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ImageModal;