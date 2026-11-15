import {Fragment} from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {CoachingAgreementTerms} from '@/src/modules/communities/contracts/coaching-agreements';
import {presentAcceptedServices, type AcceptedServicePresentation} from './accepted-service-presentation';

function serviceFields(service: AcceptedServicePresentation, sharedCadence: string | null): readonly (readonly [string, string | null])[] {
  return [
    ['Agreed quantity', service.quantity],
    ['Frequency', sharedCadence ? null : service.cadence],
    ['Coverage', service.coverage], ['Selection and submission', service.selection],
    ['Review turnaround', service.turnaround], ['Duration', service.duration],
    ['Student follow-up window', service.followUpWindow], ['Trade limit', service.tradeLimit],
    ['Journal coverage', service.journalCoverage],
    ['Focus', service.focus.length ? service.focus.join(', ') : null],
    ['Coaching details', service.details],
  ];
}

/** Read-only content composition, usable by both the agreement page and student Plans. */
export function AcceptedServiceDetails({terms}: {terms: CoachingAgreementTerms}) {
  const view = presentAcceptedServices(terms);
  return <Stack spacing={2} sx={{minWidth: 0, color: 'text.primary'}}>
    {view.description ? <Box>
      <Typography component="p" variant="body2" sx={{color: 'text.secondary', mb: 0.5}}>Description</Typography>
      <Typography component="p" sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{view.description}</Typography>
    </Box> : null}
    {view.commonCadence ? <Box>
      <Typography component="p" variant="body2" sx={{color: 'text.secondary', mb: 0.5}}>Service frequency</Typography>
      <Typography component="p">{view.commonCadence}</Typography>
    </Box> : null}
    {view.services.map(service => <Box key={service.planItemId} component="section" aria-label={service.title}
      sx={{borderTop: 1, borderColor: 'divider', pt: 2, minWidth: 0}}>
      <Typography component="h4" variant="subtitle1" sx={{fontWeight: 700, mb: 1.5}}>{service.title}</Typography>
      <Box component="dl" sx={{m: 0, display: 'grid', gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'minmax(8rem, 11rem) minmax(0, 1fr)'}, columnGap: 2, rowGap: 1}}>
        {serviceFields(service, view.commonCadence).filter((row): row is readonly [string, string] => row[1] !== null).map(([label, value]) =>
          <Fragment key={label}>
            <Typography component="dt" variant="body2" sx={{color: 'text.secondary'}}>{label}</Typography>
            <Typography component="dd" variant="body2" sx={{m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{value}</Typography>
          </Fragment>)}
      </Box>
    </Box>)}
  </Stack>;
}
