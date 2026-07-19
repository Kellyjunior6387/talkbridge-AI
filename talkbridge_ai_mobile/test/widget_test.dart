import 'package:flutter_test/flutter_test.dart';
import 'package:talkbridge_ai_mobile/main.dart';

void main() {
  testWidgets('shows the TalkBridge AI landing experience', (tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('TalkBridge AI'), findsOneWidget);
    expect(find.text('Every comment.'), findsOneWidget);
  });
}
