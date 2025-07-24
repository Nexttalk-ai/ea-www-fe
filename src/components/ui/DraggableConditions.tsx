import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical, FaTrash } from 'react-icons/fa';
import Select from './Select';
import MetricSelect from './MetricSelect';
import { Metric } from '../../services/metricsService';

interface Condition {
    id: string;
    name: string;
    operator: string;
    value: string;
    groupOperator?: 'AND' | 'OR';
}

interface DraggableConditionsProps {
    conditions: Condition[];
    onChange: (conditions: Condition[]) => void;
    comparisonOperators: { value: string; label: string; }[];
    metrics?: Metric[];
    onMetricSelect?: (index: number, value: string) => void;
}

const operators = [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
];

const SortableCondition = ({ 
    condition, 
    index, 
    onRemove, 
    onUpdate,
    comparisonOperators,
    metrics,
    onMetricSelect
}: {
    condition: Condition;
    index: number;
    onRemove: () => void;
    onUpdate: (condition: Condition) => void;
    comparisonOperators: { value: string; label: string; }[];
    metrics?: Metric[];
    onMetricSelect?: (index: number, value: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: condition.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        >
            <div {...attributes} {...listeners} className="cursor-grab">
                <FaGripVertical className="text-gray-400" />
            </div>
            {index > 0 && (
                <div className="w-[80px] shrink-0">
                    <Select
                        id={`group-operator-${condition.id}`}
                        options={operators}
                        value={[condition.groupOperator || 'AND']}
                        onChange={(value) => onUpdate({ ...condition, groupOperator: value[0] as 'AND' | 'OR' })}
                        multipleSelect={false}
                        placeholder="Operator"
                    />
                </div>
            )}
            {metrics && onMetricSelect ? (
                <MetricSelect
                    id={`condition-name-${condition.id}`}
                    value={condition.name}
                    onChange={(value) => {
                        onMetricSelect(index, value);
                        onUpdate({ ...condition, name: value });
                    }}
                    metrics={metrics}
                    className="flex-1"
                />
            ) : (
                <input
                    type="text"
                    value={condition.name}
                    onChange={(e) => onUpdate({ ...condition, name: e.target.value })}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Condition name"
                />
            )}
            <div className="w-[80px] shrink-0">
                <Select
                    id={`operator-${condition.id}`}
                    options={comparisonOperators}
                    value={[condition.operator]}
                    onChange={(value) => onUpdate({ ...condition, operator: value[0] })}
                    multipleSelect={false}
                    placeholder="Operator"
                />
            </div>
            <input
                type="text"
                value={condition.value}
                onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
                className="w-[200px] shrink-0 rounded-md border border-gray-300 px-4 py-2 bg-white text-sm text-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Value"
            />
            <button
                type="button"
                onClick={onRemove}
                className="text-red-500 hover:text-red-700"
            >
                <FaTrash />
            </button>
        </div>
    );
};

const DraggableConditions: React.FC<DraggableConditionsProps> = ({ 
    conditions, 
    onChange,
    comparisonOperators,
    metrics,
    onMetricSelect
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = conditions.findIndex((condition) => condition.id === active.id);
            const newIndex = conditions.findIndex((condition) => condition.id === over.id);
            
            onChange(arrayMove(conditions, oldIndex, newIndex));
        }
    };

    const handleUpdate = (updatedCondition: Condition) => {
        const newConditions = conditions.map(condition => 
            condition.id === updatedCondition.id ? updatedCondition : condition
        );
        onChange(newConditions);
    };

    const handleRemove = (id: string) => {
        onChange(conditions.filter(condition => condition.id !== id));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={conditions.map(condition => condition.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {conditions.map((condition, index) => (
                        <SortableCondition
                            key={condition.id}
                            condition={condition}
                            index={index}
                            onRemove={() => handleRemove(condition.id)}
                            onUpdate={handleUpdate}
                            comparisonOperators={comparisonOperators}
                            metrics={metrics}
                            onMetricSelect={onMetricSelect}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default DraggableConditions; 