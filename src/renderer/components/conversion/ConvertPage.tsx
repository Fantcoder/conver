import React from 'react';
import { useConversionStore } from '../../stores/conversion-store';
import { DropZone } from './DropZone';
import { ConversionWheel } from './ConversionWheel';
import { ConversionProgress } from './ConversionProgress';
import { ConversionResult } from './ConversionResult';

export const ConvertPage: React.FC = () => {
  const { files, activeJob } = useConversionStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {activeJob ? (
        activeJob.status === 'processing' || activeJob.status === 'queued' ? (
          <ConversionProgress />
        ) : (
          <ConversionResult />
        )
      ) : files.length > 0 ? (
        <ConversionWheel />
      ) : (
        <DropZone />
      )}
    </div>
  );
};
