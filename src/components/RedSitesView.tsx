import React from 'react';
import { RedAddressesView } from './RedAddressesView';
import { RedSite } from '../types';

export { RedAddressesView };
export { RedAddressDetailModal } from './RedAddressDetailModal';

interface RedSitesViewProps {
  redSitesList: RedSite[];
  onAddRedSite?: (newItem: RedSite) => void;
  onResetRedSites?: () => void;
}

export const RedSitesView: React.FC<RedSitesViewProps> = (props) => {
  return <RedAddressesView {...props} />;
};

export default RedSitesView;
