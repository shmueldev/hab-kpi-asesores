import {useLocation} from '@docusaurus/router';
import Content from '@theme-original/DocItem/Content';

export default function DocItemContent(props) {
  const {pathname} = useLocation();
  return (
    <div className="hab-doc-enter" key={pathname}>
      <Content {...props} />
    </div>
  );
}
