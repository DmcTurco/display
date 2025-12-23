import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image, X, Lock } from 'lucide-react';
import AdditionalItems from './AdditionalItems';
import { use } from 'react';
import { MdFiberNew } from "react-icons/md";
import _ from "lodash";

const MainItem = ({
  item,
  allorders,
  onItemClick,
  allAdditionalsComplete,
  hasAdditionals,
  isExpanded,
  expandedItemId,
  type_display,
  selectedItems,
  onToggleSelection,
  onImageClick,
  isLastOrderItems
}) => {

  // 🔍 DEBUG: Ver qué llega a MainItem
  // console.log(`🎯 MainItem renderizando "${item.name}":`, {
  //   isBorrowedParent: item.isBorrowedParent,
  //   isDisabled: item.isDisabled,
  //   belongs_to_kitchen: item.belongs_to_kitchen,
  //   isParent: item.isParent
  // });
  const isCompleted = item.kitchen_status === 1;
  const isServed = item.serving_status === 1;
  const [isTouching, setIsTouching] = useState(false);
  const isServing = type_display == 2;
  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const selectionMode = config.selectionMode || "1";
  // console.log("#",item);

  // 🔥 NUEVO: Verificar si el item está deshabilitado
  const isDisabled = item.isDisabled === true;
  const isBorrowedParent = item.isBorrowedParent === true;

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-1xl';
      case 'large':
        return 'text-3xl';
      default: // normal
        return 'text-2xl';
    }
  };

  const getQuantityFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-2xl';
      case 'large':
        return 'text-4xl';
      default: // normal
        return 'text-3xl';
    }
  };

  const isCompletedHere =
    !isBorrowedParent && item.kitchen_status === 1;

  const isCompletedElsewhere =
    isBorrowedParent && item.kitchen_status === 1;

  const isParentCompletedByChildren =
    !isBorrowedParent &&
    item.isParent &&
    allAdditionalsComplete;
  // 🔥 MODIFICADO: Items deshabilitados no son clickeables
  const isClickable = isDisabled ? false : (isServing ? (isCompleted && !isServed) : !isCompleted);
  const isSelected = selectedItems.has(item.id);

  const getBackgroundColor = () => {
    // 🔥 NUEVO: Color especial para items deshabilitados
    if (isDisabled) {
      return "bg-gray-100 border-2 border-dashed border-gray-300";
    }

    if (isSelected) return "bg-yellow-300";

    if (!isServing) {
      return isCompleted ? "bg-green-200" : "bg-white";
    }
    return isServed ? "bg-blue-200" : "bg-white";
  };

  const handleClick = () => {
    // 🔥 MODIFICADO: Prevenir clicks en items deshabilitados
    if (isDisabled) {
      return;
    }

    if (!isServing && !isCompleted) {
      onToggleSelection(item, 'item', null, { items: [item] });
    }
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={() => !isDisabled && setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      onTouchCancel={() => setIsTouching(false)}
      className={`
        rounded-lg p-2 shadow-sm
        transition-all duration-300
        ${getBackgroundColor()}
        ${isClickable ? "cursor-pointer hover:shadow-md" : ""}
        ${isDisabled ? "cursor-not-allowed opacity-60" : ""}
        ${isExpanded ? "border-b border-gray-200" : ""}
        ${isTouching && !isDisabled ? "bg-white" : ""}
      `}
    >
      {/* 🔥 NUEVO: Badge para padres prestados */}
      {isBorrowedParent && (
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-300">
            <Lock className="h-3 w-3" />
            参照のみ（他の端末用）
          </span>
        </div>
      )}

      {/* Item principal */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* 🔥 MODIFICADO: Icono de candado para items deshabilitados */}
          <div className="flex items-center gap-2">
            {isDisabled && (
              <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <span className={`
              ${getQuantityFontSizeClass()} 
              ${isDisabled ? 'text-gray-400' : 'text-gray-700'} 
              whitespace-nowrap font-medium
            `}>
              {item.quantity}
            </span>
          </div>

          {item.modification && item.modification !== "　" && (
            <span className={`
              ${getFontSizeClass()} 
              bg-gray-100 rounded 
              ${isDisabled ? 'text-gray-400' : 'text-red-600'}
            `}>
              {item.modification}
            </span>
          )}

          <span className={`
            ${getFontSizeClass()} 
            text-left flex-1 break-words
            ${isDisabled ? 'text-gray-400 line-through' : ''}
          `}>
            {isLastOrderItems === "true" && !isDisabled && (
              <MdFiberNew className='text-red-500 inline' />
            )}
            {item.name}
            {item.price_type === 2 && (item.later_price_change_flg === 0 || item.later_price_change_flg == null) && (
              <span className={`text-2xl ${isDisabled ? 'text-gray-400' : 'text-red-500'}`}>
                {" "}@{item.price}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador de imagen manuscrita */}
          {item.handwriteImage !== null && (
            <div
              className={`
                flex-shrink-0 p-1 rounded-full
                ${isDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-indigo-100'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled && onImageClick) {
                  onImageClick(item);
                }
              }}
            >
              <Image className={`h-5 w-5 ${isDisabled ? 'text-gray-400' : 'text-indigo-500'}`} />
            </div>
          )}

          {/* Checkmarks originales */}
          {/* Checkmarks */}
          {!isServing && (
            <>
              {/* ✔ Preparado aquí */}
              {(isCompletedHere || isParentCompletedByChildren) && (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              )}

              {/* ✔ Preparado en otro terminal */}
              {isCompletedElsewhere && (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              )}
            </>
          )}

        </div>
      </div>

      {/* Items adicionales */}
      {hasAdditionals && (
        <div className="mt-2">
          <AdditionalItems
            items={item.additionalItems}
            onItemClick={onItemClick}
            expandedItemId={expandedItemId}
            allAdditionalsComplete={allAdditionalsComplete}
            type_display={type_display}
            getFontSizeClass={getFontSizeClass}
            getQuantityFontSizeClass={getQuantityFontSizeClass}
            selectedItems={selectedItems}
            onToggleSelection={onToggleSelection}
            onImageClick={onImageClick}
          />
        </div>
      )}
    </div>
  );
};

export default MainItem;