import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Item from './Item';
import { Box } from '@chakra-ui/react';

const SortableItem = ({ id, picked, admin, index, teamData, dataMedian, dnp, isDesktop, editable }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box style={style} ref={setNodeRef} {...attributes}>
            <Item id={id} listeners={listeners} picked={picked} admin={admin} teamData={teamData} dataMedian={dataMedian} index={index} dnp={dnp} isDesktop={isDesktop} editable={editable} />
        </Box>
    );
};

export default SortableItem;
