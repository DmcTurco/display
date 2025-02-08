import React, { useMemo, useState } from "react";
import _ from "lodash";
import { ClipboardList } from "lucide-react";

const ServingTimeline = ({ orders, updateKitchenStatus }) => {
  const config = JSON.parse(localStorage.getItem("kitchenConfig")) || {};
  const kitchen_cd = config.cd;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { orderItems } = useMemo(() => {
    const orderItems = orders.map((order) => {
      // Encontrar items que tienen pid
      const itemsWithPid = order.items?.filter(item => item.pid) || [];

      // Obtener los uids únicos de los padres
      const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

      // Primero, encontrar padres que tienen al menos un hijo activo
      const activeParentUids = parentUids.filter(parentUid => {
        const children = order.items?.filter(item =>
          item.pid === parentUid &&
          !(item.kitchen_status === 1 && item.serving_status === 1)
        );
        return children.length > 0;
      });

      // Procesar todos los items
      const processedItems = order.items?.filter(item =>
        // Incluir el item si:
        (activeParentUids.includes(item.uid)) || // Es un padre con hijos activos
        (item.kitchen_status === 1 && item.serving_status === 0 && !(item.kitchen_status === 1 && item.serving_status === 1)) // Está listo para servir y no está completamente servido
      ).map(item => ({
        ...item,
        isParent: parentUids.includes(item.uid),
        isChild: Boolean(item.pid)
      })) || [];

      return {
        orderTime: order.formatted_time_update,
        elapsedTime: `${order.elapsedTime}分`,
        table: order.table_name || "Sin Mesa",
        items: processedItems,
        originalOrder: order,
      };
    }).filter((order) => order.items.length > 0);

    return {
      orderItems: _.sortBy(
        orderItems,
        (item) => new Date(item.originalOrder.record_date)
      ),
    };
  }, [orders]);

  // console.log(orderItems);

  const [selectedItemId, setSelectedItemId] = useState(null);

  const toggleRowSelection = (item) => {
    if (item.isParent) return;
    setSelectedItemId((prev) => (prev === item.id ? null : item.id));
  };

  const handleConfirm = async () => {
    if (!kitchen_cd || !selectedItemId) return;

    try {
      // Encuentra el ítem seleccionado
      const selectedItem = orderItems
        .flatMap((order) => order.items)
        .find((item) => item.id === selectedItemId);

      if (!selectedItem) return;

      // Si el ítem es un hijo, verifica si es el último por servir
      if (selectedItem.isChild && selectedItem.pid) {
        // Encuentra el padre
        const parentItem = orderItems
          .flatMap((order) => order.items)
          .find((item) => item.uid === selectedItem.pid);

        if (parentItem) {
          // Encuentra todos los hermanos (otros ítems con el mismo pid)
          const siblings = orderItems
            .flatMap((order) => order.items)
            .filter((item) => item.pid === selectedItem.pid);

          // Verifica si todos los hermanos (excepto el actual) ya están servidos
          const allSiblingsServed = siblings
            .filter(sibling => sibling.id !== selectedItemId)
            .every(sibling => sibling.serving_status === 1);

          // Si este es el último ítem por servir, actualiza también al padre
          if (allSiblingsServed) {
            await Promise.all([
              updateKitchenStatus(selectedItemId, 1, kitchen_cd, 2),
              updateKitchenStatus(parentItem.id, 1, kitchen_cd, 2)
            ]);
          } else {
            // Si no es el último, solo actualiza el ítem actual
            await updateKitchenStatus(selectedItemId, 1, kitchen_cd, 2);
          }
        }
      } else {
        // Si no es un hijo, actualiza normalmente
        await updateKitchenStatus(selectedItemId, 1, kitchen_cd, 2);
      }

      // Limpia el estado y cierra el diálogo
      setSelectedItemId(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      // Aquí podrías agregar manejo de errores (mostrar un mensaje al usuario, etc.)
    }
  };

  const handleCancel = () => {
    if (!kitchen_cd || !selectedItemId) return;

    // Encuentra el ítem seleccionado
    const selectedItem = orderItems
      .flatMap((order) => order.items)
      .find((item) => item.id === selectedItemId);

    if (!selectedItem) return;

    // Si el ítem es un hijo, encuentra su padre
    if (selectedItem.isChild) {
      const parentItem = orderItems
        .flatMap((order) => order.items)
        .find((item) => item.uid === selectedItem.pid);

      if (parentItem) {
        // Actualiza el estado del padre (por ejemplo, marcándolo como no servido)
        updateKitchenStatus(parentItem.id, 0, kitchen_cd, 1); // Cambia el estado del padre
      }
    }

    // Actualiza el estado del hijo
    updateKitchenStatus(selectedItemId, 0, kitchen_cd, 1); // Cambia el estado del hijo

    // Limpia el estado y cierra el diálogo
    setSelectedItemId(null);
    setShowCancelDialog(false);
  };

  const getTimeStyle = (elapsedTime, configTime) => {
    const minutes = parseInt(elapsedTime?.toString().replace('分', '')) || 0;
    const threshold = parseInt(configTime || 0);
    return `pt-2 pb-0 px-4 align-top font-medium w-[100px] text-center text-3xl ${minutes >= threshold ? 'text-red-500' : 'text-gray-900'
      }`;
  };

  if (!orderItems?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ClipboardList className="text-blue-500 w-16 h-16 mx-auto mb-4 animate-bounce" />
          <p className="text-2xl font-semibold text-gray-700">
            注文データがありません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="m-2 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-2 w-full h-full max-h-[calc(100vh-6rem)]">
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="sticky top-0 z-20 bg-white">
                <tr>
                  <th className="w-[100px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                    調理時間
                  </th>
                  <th className="w-[100px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                    経過時間
                  </th>
                  <th className="w-[200px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                    テーブル
                  </th>
                  <th className="py-3 px-4 bg-gray-50 text-left font-bold text-gray-800 border-b border-gray-200">
                    メニュー
                  </th>
                  <th className="w-[200px] py-3 px-4 bg-gray-50 text-right font-bold text-gray-800 border-b border-gray-200">
                    数量
                  </th>
                  <th className="w-[250px] py-3 px-4 bg-gray-50 text-right font-bold text-gray-800 border-b border-gray-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orderItems.map((order, orderIndex) => (
                  <tr key={`${order.orderTime}-${order.table}-${orderIndex}`}>
                    <td className="pt-2 pb-0 px-4 align-top w-[100px] text-center text-3xl">
                      {order.orderTime}
                    </td>
                    <td className={getTimeStyle(order.elapsedTime, config.elapsed_time)}>
                      {order.elapsedTime}
                    </td>
                    <td className="pt-2 pb-0 px-4 align-top w-[200px] text-center text-3xl">
                      {order.table}
                    </td>
                    <td colSpan="3" className="p-0">
                      <div className="divide-y divide-gray-100">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleRowSelection(item)}
                            className={`flex items-center px-4 py-2 ${item.isParent
                              ? 'bg-gray-50 cursor-default'
                              : `cursor-pointer ${selectedItemId === item.id
                                ? "bg-yellow-200"
                                : "hover:bg-gray-50"
                              }`
                              }`}
                          >
                            <div className={`flex-1 flex items-center ${item.isChild ? 'pl-8' : ''}`}>
                              {item.isChild && (
                                <div className="w-2 h-px bg-gray-300"></div>
                              )}
                              <span className="text-3xl">{item.name}</span>
                            </div>

                            <div className="w-[200px] flex justify-end">
                              {!item.isParent && (
                                <span className="inline-flex items-center justify-center w-8 h-8 text-3xl font-medium text-white bg-blue-500 rounded-full">
                                  {item.quantity}
                                </span>
                              )}
                            </div>

                            <div className="w-[250px] flex justify-end px-4">
                              {!item.isParent && selectedItemId === item.id && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowConfirmDialog(true);
                                    }}
                                    className="px-6 py-2.5 mx-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    配膳する
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowCancelDialog(true);
                                    }}
                                    className="px-6 py-2.5 mx-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    戻す
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showConfirmDialog ? "" : "hidden"
          }`}
      >
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-medium mb-2">配膳確認</h3>
          {selectedItemId ? (
            <p className="text-gray-500 mb-4">選択した料理を配膳しますか？</p>
          ) : (
            <p className="text-gray-500 mb-4">選択した料理がありません</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedItemId}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${selectedItemId
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              配膳する
            </button>
          </div>
        </div>
      </div>

      {/* Modal de cancelación */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showCancelDialog ? "" : "hidden"
          }`}
      >
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-medium mb-2">キャンセル確認</h3>
          <p className="text-gray-500 mb-4">選択した料理を調理場に戻しますか？</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCancelDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              戻る
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
            >
              調理場に戻す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServingTimeline;